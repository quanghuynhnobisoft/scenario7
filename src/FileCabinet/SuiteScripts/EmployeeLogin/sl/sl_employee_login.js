/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/file',
    'N/render',
    'N/url',

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
        url,

        // Libraries
        _,
        QHSuiteQL,
    ) => {

        const HTML_TEMPLATES = {
            USER_VIEW: 'SuiteScripts/EmployeeLogin/template/user_view.html',
            ROLE_VIEW: 'SuiteScripts/EmployeeLogin/template/role_view.html',
        }

        const SQL_Last6Months_EmployeeLogin = `/SuiteScripts/EmployeeLogin/sql/Last6MonthsEmployeeLogin.sql`;

        const SYSTEM_NOTE_SCRIPT_ID = 'customscript_sl_systemnote';
        const SYSTEM_NOTE_DEPLOY_ID = 'customdeploy_sl_systemnote';

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            const { request, response } = scriptContext;
            const form = serverWidget.createForm({
                title: 'Employee Login Activity (Last 6 Months)'
            });

            let fld_html_view = form.addField({
                id: 'custpage_html_template',
                label: 'View',
                type: serverWidget.FieldType.INLINEHTML
            });

            const view = `${request.parameters.view?.toUpperCase() || 'USER'}_VIEW`;
            if (!HTML_TEMPLATES[view]) throw `Invalid view: ${view}`;

            let tmpFile = file.load({
                id: HTML_TEMPLATES[view]
            });

            if (tmpFile) {
                let { summary, group, monthlabel } = getData(view);
                let systemNoteURL = url.resolveScript({
                    scriptId: SYSTEM_NOTE_SCRIPT_ID,
                    deploymentId: SYSTEM_NOTE_DEPLOY_ID
                });
                log.debug('summary', summary);
                log.debug('group', group);
                log.debug('monthlabel', monthlabel);

                let htmlContent = tmpFile.getContents();

                let renderer = render.create();
                renderer.templateContent = htmlContent;
                renderer.addCustomDataSource({
                    format: render.DataSource.OBJECT,
                    alias: "data",
                    data: { str: JSON.stringify({ summary, group, monthlabel, systemNoteURL }) }
                });
                fld_html_view.defaultValue = renderer.renderAsString();
            }

            response.writePage(form);
        }

        const getData = (view) => {
            let querydata = QHSuiteQL.getResults({
                sqlFile: SQL_Last6Months_EmployeeLogin,
                absolutePath: true,
                modules: {
                    file: file
                },
                execOnce: true,
            });
            log.debug('querydata', querydata);

            let groupBy;
            if (view === 'USER_VIEW') {
                groupBy = 'userid';
            } else if (view === 'ROLE_VIEW') {
                groupBy = 'roleid';
            }

            // Group data by the specified view
            let dataGroupByView = _.groupBy(querydata.Records, (v) => `gb_${v[groupBy]}`);
            log.debug('dataGroupByView', dataGroupByView);

            // Calculate summary for each group
            let summaryGroupByView = {};
            Object.keys(dataGroupByView).map(key => {
                summaryGroupByView[`${key}`] = _.reduce(dataGroupByView[key], (accumulator, current) => {
                    return {
                        ...accumulator,
                        month0: accumulator.month0 + (current.month0 || 0),
                        month1: accumulator.month1 + (current.month1 || 0),
                        month2: accumulator.month2 + (current.month2 || 0),
                        month3: accumulator.month3 + (current.month3 || 0),
                        month4: accumulator.month4 + (current.month4 || 0),
                        month5: accumulator.month5 + (current.month5 || 0),
                    };
                }, {...dataGroupByView[key][0], month0: 0, month1: 0, month2: 0, month3: 0, month4: 0, month5: 0});
            });
            log.debug('summaryGroupByView', summaryGroupByView);

            let data = {
                summary: summaryGroupByView,
                group: dataGroupByView,
                monthlabel: [
                    querydata.Records[0].month5_label,
                    querydata.Records[0].month4_label,
                    querydata.Records[0].month3_label,
                    querydata.Records[0].month2_label,
                    querydata.Records[0].month1_label,
                    querydata.Records[0].month0_label
                ]
            };
            log.debug('getData', data);
            return data;
        }

        return { onRequest }

    });
