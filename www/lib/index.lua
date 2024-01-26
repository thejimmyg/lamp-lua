local template = require('template')


local function handle_index(r, dbh)
    local statement, err = dbh:prepared(r, "index")
    if err then
        r:debug('Could not get the index prepared statement: ' .. err)
        return nil, 500, "Database prepared statement error"
    end

    local res, err = statement:select()
    if err then
        r:debug('Could not execute the index select statement: ' .. err)
        return nil, 500, "Database select error"
    end

    local row = res(1)
    for k, v in pairs(row) do
        r:debug('row ' .. k .. ', ' .. v)
    end

    return row[1], 200
end


local function safely_acquire_db_connection(r)
    local dbh, err = r:dbacquire("mod_dbd")
    if err then
        r:debug('Could not acquire a connection: ' .. err)
        return nil, 500, "Database connection error"
    end
    return dbh
end


function handle(r)
    local query, query_multi = r:parseargs()
    local path = query['path']

    -- Connect to the database only for paths that require it
    local dbh
    if path == '/db' then
        dbh, err_code, err_msg = safely_acquire_db_connection(r)
        if not dbh then
            r.status = err_code
            r:puts(err_msg)
            return apache2.OK
        end
    end

    if path == '/' then
        r:puts(template.Base:new('Home', 'Home'):render())
    elseif path == '/db' then
        local data, err_code, err_msg = handle_index(r, dbh)
        if not data then
            r.status = err_code
            r:puts(err_msg)
        else
            r:puts(template.Base:new('DB', data):render())
        end
    elseif path == "/include/top.shtml" then
        r:puts(template.top_shtml:render())
    elseif path == "/include/body.shtml" then
        r:puts(template.body_shtml:render())
    elseif path == "/include/bottom.shtml" then
        r:puts(template.bottom_shtml:render())
    else
        r.status = 404
        r:puts(template.Base:new('Not Found', 'Not Found'):render())
    end

    -- Close the database connection if it was opened
    if dbh then
        dbh:close()
    end

    r.content_type = "text/html"
    r.status = 200
    return apache2.OK
end
