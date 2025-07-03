SELECT 
	la.user as userid,
	BUILTIN.DF(la.user) as username,
	la.emailAddress as email,
	la.role as roleid,
    BUILTIN.DF(la.role) as rolename,
    e.isinactive as inactive,
    e.giveaccess as access,
	COALESCE(BUILTIN.DF(e.department), ' ') as department,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'YYYY-MM') THEN 1 ELSE 0 END) AS month0,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'YYYY-MM') THEN 1 ELSE 0 END) AS month1,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'YYYY-MM') THEN 1 ELSE 0 END) AS month2,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'YYYY-MM') THEN 1 ELSE 0 END) AS month3,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'YYYY-MM') THEN 1 ELSE 0 END) AS month4,
	SUM(CASE WHEN to_char(date, 'YYYY-MM') = to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'YYYY-MM') THEN 1 ELSE 0 END) AS month5,
	to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'Mon YYYY') as month0_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'Mon YYYY') as month1_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'Mon YYYY') as month2_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'Mon YYYY') as month3_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'Mon YYYY') as month4_label,
	to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'Mon YYYY') as month5_label
FROM 
    LoginAudit la
	INNER JOIN employee e ON e.id = la.user
WHERE
    la.status = 'Success'
    AND date BETWEEN TRUNC(ADD_MONTHS(CURRENT_DATE(), -5),'mm') AND LAST_DAY(CURRENT_DATE())
GROUP BY
	la.user,
	la.emailAddress,
	la.role,
    BUILTIN.DF(la.role),
    BUILTIN.DF(la.user),
    e.isinactive,
    e.giveaccess,
    COALESCE(BUILTIN.DF(e.department), ' '),
	to_char(ADD_MONTHS(CURRENT_DATE(), 0), 'Mon YYYY'),
	to_char(ADD_MONTHS(CURRENT_DATE(), -1), 'Mon YYYY'),
	to_char(ADD_MONTHS(CURRENT_DATE(), -2), 'Mon YYYY'),
	to_char(ADD_MONTHS(CURRENT_DATE(), -3), 'Mon YYYY'),
	to_char(ADD_MONTHS(CURRENT_DATE(), -4), 'Mon YYYY'),
	to_char(ADD_MONTHS(CURRENT_DATE(), -5), 'Mon YYYY')
ORDER BY
	BUILTIN.DF(la.user), BUILTIN.DF(la.role) ASC