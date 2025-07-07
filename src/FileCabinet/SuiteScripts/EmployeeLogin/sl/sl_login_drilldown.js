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
                const { user, role, page, exportcsv } = request.parameters;
                try {
                    if (exportcsv && exportcsv == 'T') {
                        let f_csv = exportCSV({ user, role, pageSize: PAGE_SIZE, pageIndex: -1 });
                        response.writeFile({
                            file: f_csv
                        });
                    } else {
                        // Find User name and Role name
                        const form = serverWidget.createForm({
                            title: 'System Notes'
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

                            let data = getData({ user, role, pageSize: PAGE_SIZE, pageIndex: page });
                            data.user ? form.title += ` for ${data.user}` : form.title += ' Unknown User';
                            data.role ? form.title += ` (Role: ${data.role})` : form.title += ' (Unknown Role)';

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
            const { user, role, pageSize, pageIndex, getAll } = options;
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
                pageIndex: getAll ? -1 : Math.max((pageIndex || 0) - 1, 0)
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

        // export getData function to csv
        function exportCSV(options) {
            const { user, role } = options;
            const fileName = `SystemNotes_${user || 'UnknownUser'}_${role || 'UnknownRole'}.csv`;
            let HEADERs = ['Record Type', 'Record', 'Context'];
            log.debug('exportCSV - options', options);

            let data = getData({ user, role, getAll: true });

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