SELECT 
    DISTINCT
    s.context as value,
    COALESCE(BUILTIN.DF(s.context), 'Unknown') as text
FROM SystemNote s
WHERE s.date BETWEEN TRUNC(ADD_MONTHS(CURRENT_DATE(), -5),'mm') AND LAST_DAY(CURRENT_DATE())
    @{user}
    @{role}