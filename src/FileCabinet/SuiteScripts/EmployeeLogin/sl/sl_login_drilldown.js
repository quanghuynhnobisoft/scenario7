/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/* global log */
define([
    'N/ui/serverWidget',
    'N/file',
    'N/render',

    // Libraries
    '/SuiteScripts/EmployeeLogin/lib/External/lodash.min.js',

    // Custom Libraries
    '/SuiteScripts/EmployeeLogin/lib/Custom/QHSuiteQL.js',
],
    /**
     * @param{serverWidget} serverWidget
     */
    (
        serverWidget,
        file,
        render,

        _,

        QHSuiteQL
    ) => {

        const VIEW_TEMPLATE = 'SuiteScripts/EmployeeLogin/template/systemnote_view.html';
        const SQL_Last6Months_SystemNoteByUserRole = `/SuiteScripts/EmployeeLogin/sql/SystemNoteByUserAndRole.sql`;
        const SQL_RECORD_FILTER = '/SuiteScripts/EmployeeLogin/sql/SystemNoteAllRecords.sql';
        const SQL_RECORDTYPE_FILTER = '/SuiteScripts/EmployeeLogin/sql/SystemNoteAllRecordTypes.sql';
        const SQL_CONTEXT_FILTER = '/SuiteScripts/EmployeeLogin/sql/SystemNoteAllContexts.sql';

        const PAGE_SIZE = 20; // Default page size

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const { request, response } = scriptContext;
            log.debug('onRequest - parameters', request.parameters);

            if (request.method == 'GET') {
                const { user, role, rname, uname, page, exportcsv, rectype, recd, context } = request.parameters;
                let filters = {
                    rectype: rectype || '',
                    recd: recd || '',
                    context: context || '',
                };
                try {
                    if (exportcsv && exportcsv == 'T') {
                        let f_csv = exportCSV({ user, role, exportcsv, pageSize: PAGE_SIZE, pageIndex: -1, filters });
                        response.writeFile({
                            file: f_csv
                        });
                    } else {
                        let title = 'System Notes';
                        if (uname) title += ` for ${uname}`;
                        if (rname) title += ` (Role: ${rname})`;
                        // Find User name and Role name
                        const form = serverWidget.createForm({
                            title: title
                        });

                        let tmplFile = file.load({
                            id: VIEW_TEMPLATE
                        });

                        if (tmplFile) {

                            let fld_html_view = form.addField({
                                id: 'custpage_html_template',
                                label: 'View',
                                type: serverWidget.FieldType.INLINEHTML
                            });

                            let data = getData({ user, role, pageSize: PAGE_SIZE, pageIndex: page, filters });

                            let htmlContent = tmplFile.getContents();

                            let renderer = render.create();
                            renderer.templateContent = htmlContent;
                            renderer.addCustomDataSource({
                                format: render.DataSource.OBJECT,
                                alias: "data",
                                data: { str: JSON.stringify(data) }
                            });
                            fld_html_view.defaultValue = renderer.renderAsString();
                        }

                        response.writePage(form);
                    }
                } catch (error) {
                    log.error('Error rendering GET response', error);
                    response.write(JSON.stringify({ error: 'An error occurred while processing your request.' }));
                }
            } else {
                log.error('Unsupported request method', `Received ${request.method}`);
                response.write('Unsupported request method');

            }
        }

        const getData = (options) => {
            const { user, role, pageSize, pageIndex, exportcsv, filters = {} } = options;
            log.debug('getData - options', options);

            let data = { data: [], monthlabel: ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'] };
            let recordid = '';
            if (!user || !role) {
                log.error('getData - Missing parameters', 'User and Role are required');
                throw 'User and Role are required';
            }

            let { rectype, recd, context } = filters;
            if (!rectype && recd?.length) {
                rectype = recd.split('@@')[0];
            }

            if (recd?.length) recordid = recd.split('@@')[1];

            let querydata = QHSuiteQL.getResults({
                sqlFile: SQL_Last6Months_SystemNoteByUserRole,
                absolutePath: true,
                modules: {
                    file: file
                },
                parameters: {
                    user: user ? ` AND s.name = ${user} ` : '',
                    role: role ? ` AND s.role = ${role} ` : '',
                    recordtype: rectype ? (rectype.toLowerCase() != 'null' ? ` AND s.recordTypeId = '${rectype}' ` : ` AND s.recordTypeId IS NULL `) : '',
                    record: recordid ? (recordid.toLowerCase() != 'null' ? ` AND s.recordId = '${recordid}' ` : ` AND s.recordId IS NULL `) : '',
                    context: context ? (context.toLowerCase() != 'null' ? ` AND s.context = '${context}' ` : ` AND s.context IS NULL `) : '',
                },
                pageSize: pageSize || 20,
                pageIndex: exportcsv == 'T' ? -1 : Math.max((pageIndex || 0) - 1, 0)
            });
            log.debug('querydata', querydata);

            if (querydata.Records?.length) querydata.Records.forEach((record) => {
                if (!record.recordtypeid) record.recordtypeid = '';
                if (!record.recordid) record.recordid = '';
                if (!record.contextid) record.contextid = '';
            });

            data = {
                monthlabel: querydata.Records?.length ? [
                    querydata.Records[0].month5_label,
                    querydata.Records[0].month4_label,
                    querydata.Records[0].month3_label,
                    querydata.Records[0].month2_label,
                    querydata.Records[0].month1_label,
                    querydata.Records[0].month0_label
                ] : [],
                filters: {
                    rectype,
                    recd,
                    context
                },
                recordtypeoptions: QHSuiteQL.getResults({
                    sqlFile: SQL_RECORDTYPE_FILTER,
                    absolutePath: true,
                    modules: {
                        file: file
                    },
                    parameters: {
                        user: user ? ` AND s.name = ${user} ` : '',
                        role: role ? ` AND s.role = ${role} ` : '',
                    },
                    pageIndex: -1
                }).Records.map((v) => {
                    if (!v.value) v.value = 'NULL';
                    return v;
                }),
                contextoptions: QHSuiteQL.getResults({
                    sqlFile: SQL_CONTEXT_FILTER,
                    absolutePath: true,
                    modules: {
                        file: file
                    },
                    parameters: {
                        user: user ? ` AND s.name = ${user} ` : '',
                        role: role ? ` AND s.role = ${role} ` : '',
                    },
                    pageIndex: -1
                }).Records.map((v) => {
                    if (!v.value) v.value = 'NULL';
                    return v;
                }),
                ...querydata,
                recordoptions: QHSuiteQL.getResults({
                    sqlFile: SQL_RECORD_FILTER,
                    absolutePath: true,
                    modules: {
                        file: file
                    },
                    parameters: {
                        user: user ? ` AND s.name = ${user} ` : '',
                        role: role ? ` AND s.role = ${role} ` : '',
                    },
                    pageIndex: -1
                }).Records.map((v) => {
                    if (!v.value) v.value = 'NULL';
                    if (!v.type) v.type = 'NULL';
                    return v;
                }),
            };
            log.debug('getData', data);
            return data;
        }

        // export getData function to csv
        function exportCSV(options) {
            const { user, role, exportcsv, filters } = options;
            const fileName = `SystemNotes_${user || 'UnknownUser'}_${role || 'UnknownRole'}.csv`;
            let HEADERs = ['Record Type', 'Record', 'Context'];
            log.debug('exportCSV - options', options);

            let data = getData({ user, role, exportcsv, filters });

            // Convert data to CSV format
            let csvRows = [HEADERs.join(',')];
            if (data.Records?.length) {
                HEADERs.push(...data.monthlabel, 'Total');
                csvRows = [
                    HEADERs.join(','),
                    ...data.Records.map(record => `"${record.recordtypename}","${record.record}","${record.context}",${record.month5 || 0},${record.month4 || 0},${record.month3 || 0},${record.month2 || 0},${record.month1 || 0},${record.month0 || 0},${record.total || 0}`)
                ];
            }
            log.debug('exportCSV - csvRows', csvRows);

            let f_csv = file.create({
                name: fileName,
                fileType: file.Type.CSV,
                contents: csvRows.join('\n'),
                encode: file.Encoding.UTF8,
            });
            return f_csv;
        }

        return { onRequest }

    });