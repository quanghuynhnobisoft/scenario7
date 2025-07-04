/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
/* global log */
define([
    'N/query',
    'N/render'
], function (
    query,
    render
) {
    const SQL_PATH = 'SuiteScripts/sql/';

    /**
     * Make sure not to use the value in Get/Post to prevent sql injection
    */
    function executeQuery(sql){
        var result = null;
        let queryResult = query.runSuiteQL({ query: sql }).asMappedResults();
        if(queryResult.length && queryResult.length > 0){
            result = queryResult;
        }
        return result;
    }

    /**
     * Recommend to use executeQueryParams to prevent sql injection
    */
    function executeQueryParams(sql, params){
        var result = null;
        let queryResult = query.runSuiteQL({ query: sql, params: params }); 
        if(queryResult.length && queryResult.length > 0){
            result = queryResult;
        }
        return result;
    }
    
    /**
     * Required "FETCH FIRST ROW ONLY" OR "FETCH FIRST 1 ROWS ONLY"
     * @param {string} sql 
     * @param {string} field name to get data 
     * @param {any} default value
     * @returns Only one value of fieldName param
    */
    function getFieldValue(sql, fieldName, defaultValue) {
        var fieldValue = defaultValue;
        let queryResult = executeQuery(sql);
        if(queryResult != null){
            let firstResult = queryResult[0];
            fieldValue = firstResult[fieldName];
        }
        return fieldValue;
    }

    function executeQueryMax5k(sql) {
        let result = {
            ErrorCode: 0,
            Message: '',
            Records: [],
            TotalRecords: 0
        };
        if (!sql) return result;
        log.debug("executeQueryMax5k - query", sql);
        let allResults = [];
        try {
            allResults = query.runSuiteQL({
                query: sql
            }).asMappedResults();
            log.debug("allResults.count", allResults.length);
            result.Records = allResults;
            result.TotalRecords = allResults.length;
        } catch (error) {
            log.error('executeQueryMax5k', error);
            log.error('executeQueryMax5k - stack', error.stack);
            result.ErrorCode = -1;
            result.Message = error.Message;
        }
        return result;
    }

    /**
     * 
     * @param {string} sql 
     * @param {number} pageSize 
     * @returns Array of result objects
     * PagedData -> Iterator() -> Page -> ResultSet (Page.data) -> asMappedResults() = Mapped result object
     * PagedData -> fetch(i) -> Page
     */
    function executePagedQuery(sql, pageSize) {
        let result = {
            ErrorCode: 0,
            Message: '',
            Records: [],
            TotalRecords: 0
        };
        if (!sql || !pageSize) return result;
        log.debug("executePagedQuery - query", sql);
        log.debug("executePagedQuery - pageSize", pageSize);
        let allResults = [];
        try {
            let pagedData = query.runSuiteQLPaged({
                query: sql,
                pageSize: pageSize
            });
            pagedData.pageRanges.forEach(function (page) {
                allResults = allResults.concat(pagedData.fetch(page.index).data.asMappedResults());
            });
            log.debug("allResults.count", allResults.length);
            result.Records = allResults;
            result.TotalRecords = allResults.length;
            result.PageSize = pageSize;
        } catch (error) {
            log.error('executePagedQuery', error);
            log.error('executePagedQuery - stack', error.stack);
            result.ErrorCode = -1;
            result.Message = error.Message;
        }
        return result;
    }

    /**
     * 
     * @param {string} sql 
     * @param {number} pageSize 
     * @returns Array of result objects
     * PagedData -> Iterator() -> Page -> ResultSet (Page.data) -> asMappedResults() = Mapped result object
     * PagedData -> fetch(i) -> Page
     */
    function executePagedIndexQuery(sql, pageSize, pageIndex) {
        let result = {
            ErrorCode: 0,
            Message: '',
            Records: [],
            TotalRecords: 0
        };
        if (!sql || !pageSize) return result;
        log.debug("executePagedIndexQuery - query", sql);
        log.debug("executePagedIndexQuery - pageSize", pageSize);
        log.debug("executePagedIndexQuery - pageIndex", pageIndex);
        let allResults = [];
        if (!pageIndex) pageIndex = 0;
        try {
            let pagedData = query.runSuiteQLPaged({
                query: sql,
                pageSize: pageSize
            });
            log.debug("allResults.count", pagedData.count);
            if (pagedData.count) {
                if (pagedData.pageRanges && pageIndex > pagedData.pageRanges.length) {
                    pageIndex = pagedData.pageRanges.length - 1;
                }
                allResults = allResults.concat(pagedData.fetch(pageIndex).data.asMappedResults());
                result.Records = allResults;
                result.TotalRecords = pagedData.count;
                result.PageSize = pageSize;
                result.PageIndex = pageIndex;
                result.PageRanges = pagedData.pageRanges;
            }
        } catch (error) {
            log.error('executePagedIndexQuery', error);
            log.error('executePagedIndexQuery - stack', error.stack);
            result.ErrorCode = -1;
            result.Message = error.Message;
        }
        return result;
    }

    /**
     * 
     * @param {string} sql 
     * @param {number} pageSize 
     * @returns Array of result objects
     * PagedData -> Iterator() -> Page -> ResultSet (Page.data) -> asMappedResults() = Mapped result object
     * PagedData -> fetch(i) -> Page
     */
     function getResultCount(options) {
        if (!options) return null;
        loadSQLFromFile(options);
        if (options.originalSQL) {
            if (options.parameters) {
                options.originalSQL = replaceParameters(options.originalSQL, options.parameters);
            }
            return countTotal(options.originalSQL);
        } else {
            // throw SQL is empty.
            return 0;
        }
    }

    function countTotal(sql) {
        let result = 0;
        log.debug("getResultCount - query", sql);
        try {
            let pagedData = query.runSuiteQLPaged({
                query: sql
            });
            log.debug("getResultCount count", pagedData.count);
            result = pagedData.count;
        } catch (error) {
            log.error('countTotal', error);
            log.error('countTotal - stack', error.stack);
        }
        return result;
    }

    function replaceParameters(originalSQL, parameters) {
        if (!originalSQL) return '';
        log.debug("originalSQL", originalSQL);
        log.debug("parameters", parameters);
        let newSQL = originalSQL;
        if (!parameters) return newSQL;
        Object.keys(parameters).forEach(function (key) {
            let regex = new RegExp("@{" + key + "}", "gmi");
            let value = parameters[key];
            if (parameters[key] instanceof Array) {
                value = JSON.stringify(parameters[key]).slice(1, -1);
            }
            newSQL = newSQL.replace(regex, value);
            log.debug("replaced " + key, value);
        });
        log.debug("replaceParameters - newSQL", newSQL);
        return newSQL;
    }

    function loadSQLFromFile(options) {
        if (!options) return null;
        if (options.sqlFile && options.modules.file) {
            let f = options.modules.file.load({
                id: options.absolutePath ? options.sqlFile : SQL_PATH + options.sqlFile
            });
            options.originalSQL = f.getContents();
            log.debug("loadSQLFromFile - originalSQL", options.originalSQL);
            return options.originalSQL;
        } else {
            return null;
        }
    }

    /**
     * 
     * @param {object} options 
     * @param {string} options.sqlFile
     * @param {string} options.originalSQL
     * @param {object} options.modules
     * @param {nsmodule} options.modules.file
     * @param {array} options.parameters
     * @param {boolean} options.execOnce
     * @param {boolean} options.absolutePath
     * @param {number} options.pageSize
     * @returns {object} {ErrorCode, Message, Records, TotalRecords}
     */
    function getResults(options) {
        if (!options) return null;
        loadSQLFromFile(options);
        if (options.originalSQL) {
            if (options.parameters) {
                options.originalSQL = replaceParameters(options.originalSQL, options.parameters);
            }
            if (options.execOnce) {
                return executeQueryMax5k(options.originalSQL);
            } else if (options.pageIndex >= 0) {
                return executePagedIndexQuery(options.originalSQL, options.pageSize || 1000, options.pageIndex);
            } else {
                return executePagedQuery(options.originalSQL, options.pageSize || 1000);
            }
        } else {
            // throw SQL is empty.
            return null;
        }
    }

    /**
     * 
     * @param {object} options 
     * @param {string} options.sqlFile
     * @param {string} options.originalSQL
     * @param {object} options.modules
     * @param {nsmodule} options.modules.file
     * @param {array} options.parameters
     * @param {boolean} options.execOnce
     * @param {boolean} options.absolutePath
     * @param {number} options.pageSize
     * @returns {object} {ErrorCode, Message, Records, TotalRecords}
     */
    function getSQLString(options) {
        if (!options) return null;
        loadSQLFromFile(options);
        if (options.originalSQL) {
            if (options.parameters) {
                options.originalSQL = replaceParameters(options.originalSQL, options.parameters);
            }
            return options.originalSQL;
        } else {
            // throw SQL is empty.
            return null;
        }
    }

    function buildSQLByRenderM(options) {
        if (!options) return null;
        log.debug('buildSQLByRenderM - options:', options);
        loadSQLFromFile(options);
        if (options.originalSQL) {
            let sqlBuilder = render.create();
            sqlBuilder.templateContent = options.originalSQL;
            sqlBuilder.addCustomDataSource({
                alias: 'record',
                format: render.DataSource.OBJECT,
                data: {
                    parameters: options.parameters
                }
            });
            options.originalSQL = sqlBuilder.renderAsString();       
        }
        log.debug('buildSQLByRenderM', options.originalSQL);     
        return options.originalSQL;
    }

    return {
        executeQuery : executeQuery,
        executeQueryParams: executeQueryParams,
        getFieldValue: getFieldValue,
        executeQueryMax5k: executeQueryMax5k,
        executePagedQuery: executePagedQuery,
        executePagedIndexQuery: executePagedIndexQuery,
        replaceParameters: replaceParameters,
        loadSQLFromFile: loadSQLFromFile,
        getResults: getResults,
        getResultCount: getResultCount,
        getSQLString: getSQLString,
        buildSQLByRenderM: buildSQLByRenderM
    };

});
