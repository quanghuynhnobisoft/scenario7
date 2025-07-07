SELECT 
    BUILTIN.DF(s.name) as user,
    BUILTIN.DF(s.role) as role,
    COALESCE(BUILTIN.DF(s.context), 'Unknown') as context,
    s.recordTypeId,
    COALESCE(BUILTIN.DF(s.recordTypeId), 'Unknown') as recordtypename,
    s.recordId,
    COALESCE(s.record, 'Unknown') as record,
    SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'YYYY-MM') THEN 1 ELSE 0 END) +
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'YYYY-MM') THEN 1 ELSE 0 END) +
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'YYYY-MM') THEN 1 ELSE 0 END) +
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'YYYY-MM') THEN 1 ELSE 0 END) +
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'YYYY-MM') THEN 1 ELSE 0 END) +
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'YYYY-MM') THEN 1 ELSE 0 END) AS total,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'YYYY-MM') THEN 1 ELSE 0 END) AS month0,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'YYYY-MM') THEN 1 ELSE 0 END) AS month1,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'YYYY-MM') THEN 1 ELSE 0 END) AS month2,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'YYYY-MM') THEN 1 ELSE 0 END) AS month3,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'YYYY-MM') THEN 1 ELSE 0 END) AS month4,
	SUM(CASE WHEN to_char(s.date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'YYYY-MM') THEN 1 ELSE 0 END) AS month5,
	to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'Mon YYYY') as month0_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'Mon YYYY') as month1_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'Mon YYYY') as month2_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'Mon YYYY') as month3_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'Mon YYYY') as month4_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'Mon YYYY') as month5_label
FROM (
    SELECT * FROM SystemNote ORDER BY date DESC
) s
WHERE s.date BETWEEN TRUNC(ADD_MONTHS(CURRENT_DATE(), -5),'mm') AND LAST_DAY(CURRENT_DATE())
    @{user}
    @{role}
GROUP BY
    BUILTIN.DF(s.name),
    BUILTIN.DF(s.role),
    BUILTIN.DF(s.context),
    s.recordTypeId,
    BUILTIN.DF(s.recordTypeId),
    s.recordId,
    s.record,
    to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'Mon YYYY'),
    to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'Mon YYYY'),
    to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'Mon YYYY'),
    to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'Mon YYYY'),
    to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'Mon YYYY'),
    to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'Mon YYYY')
