SELECT 
    DISTINCT
    s.recordTypeId as type,
    s.recordId as value,
    COALESCE(s.record, 'Unknown') as text
FROM SystemNote s
WHERE s.date BETWEEN TRUNC(ADD_MONTHS(CURRENT_DATE(), -5),'mm') AND LAST_DAY(CURRENT_DATE())
    @{user}
    @{role}