function check_access(r)
    -- return apache2.OK
    local session = r:getcookie('session')
    if session then
        r:debug(session)
        local dbh, err = r:dbacquire("mod_dbd")
        if err then
            r:debug('Could not acquire a connection: ' .. err)
            return 500
        end
        r:debug('Got database handle')
        local statement, err = dbh:prepared(r, "check_session")
        if err then
            r:debug('Could not get the check session statement: ' .. err)
            return 500
        end
        r:debug('Got check_session prepared statement')
        local res, err = assert(statement:select(session))
        if err then
            r:debug('Could not get execute the check session select statement: ' .. err)
            return 500
        end
        r:debug('Successfully made the check_session query')
        local row = res(1)
        if row then
            for k,v in pairs(row) do
                r:debug('row ' .. k .. ', ' .. v)
            end
            r:debug('Successfully found the session in the database')
            return apache2.OK
        else
            r:debug('No data for this session in the database. Perhaps it does not exist or has expired?')
        end
        dbh:close()
    else
        r:debug('No session cookie')
    end
    return 401
end
