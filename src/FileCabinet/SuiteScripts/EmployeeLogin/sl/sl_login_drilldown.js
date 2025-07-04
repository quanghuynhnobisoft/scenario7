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

            
            if (request.method == 'GET') {
                const { user, role, page } = request.parameters;
                try {
                    // Find User name and Role name
                    const form = serverWidget.createForm({
                        title: 'System Notes for'
                    });

                    let fld_html_view = form.addField({
                        id: 'custpage_html_template',
                        label: 'View',
                        type: serverWidget.FieldType.INLINEHTML
                    });

                    let tmplFile = file.load({
                        id: VIEW_TEMPLATE
                    });

                    if (tmplFile) {
                        let data = getData({ user, role, pageSize: PAGE_SIZE, pageIndex: page });
                        data.user? form.title += ` ${data.user}` : form.title += ' Unknown User';
                        data.role? form.title += ` (Role: ${data.role})` : form.title += ' (Unknown Role)';

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
            const { user, role, pageSize, pageIndex } = options;
            log.debug('getData - options', options);

            let data = { data: [], monthlabel: ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'] };

            if (!user || !role) {
                log.error('getData - Missing parameters', 'User and Role are required');
                throw 'User and Role are required';
            }

            let querydata = QHSuiteQL.getResults({
                sqlFile: SQL_Last6Months_SystemNoteByUserRole,
                absolutePath: true,
                modules: {
                    file: file
                },
                parameters: {
                    user: user ? ` AND s.name = ${user} ` : '',
                    role: role ? ` AND s.role = ${role} ` : '',
                },
                pageSize: pageSize || 20,
                pageIndex: Math.max((pageIndex || 0) - 1, 0)
            });
            log.debug('querydata', querydata);

            data = {
                monthlabel: querydata.Records?.length ? [
                    querydata.Records[0].month5_label,
                    querydata.Records[0].month4_label,
                    querydata.Records[0].month3_label,
                    querydata.Records[0].month2_label,
                    querydata.Records[0].month1_label,
                    querydata.Records[0].month0_label
                ] : [],
                user: querydata.Records?.length ? querydata.Records[0].user : '',
                role: querydata.Records?.length ? querydata.Records[0].role : '',
                ...querydata,
            };
            log.debug('getData', data);
            return data;
        }

        return { onRequest }

    });
