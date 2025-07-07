SELECT 
    DISTINCT
    s.recordTypeId as value,
    COALESCE(BUILTIN.DF(s.recordTypeId), 'Unknown') as text
FROM SystemNote s
WHERE s.date BETWEEN TRUNC(ADD_MONTHS(CURRENT_DATE(), -5),'mm') AND LAST_DAY(CURRENT_DATE())
    @{user}
    @{role}