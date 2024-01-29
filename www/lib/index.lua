local template = require('template')


local function handle_paths(r, path, dbh)
    if path == '/' then
        r:puts(template.Base:new('Home', 'Home'):render())
        return apache2.OK
    elseif path == '/login' then
        local login = require('handle/login')
        return login.handle(r, dbh)
    elseif path == '/logout' then
        local logout = require('handle/logout')
        return logout.handle(r, dbh)
    elseif path == '/db' then
        local db = require('handle/db')
        return db.handle(r, dbh)
    elseif path == "/include/top.shtml" then
        r:puts(template.top_shtml:render())
        return apache2.OK
    elseif path == "/include/body.shtml" then
        r:puts(template.body_shtml:render())
        return apache2.OK
    elseif path == "/include/bottom.shtml" then
        r:puts(template.bottom_shtml:render())
        return apache2.OK
    else
        r:err('Could not find path: ' .. path)
        r.status = 404
        r:puts(template.Base:new('Not Found', 'Not Found'):render())
        return apache2.OK
    end
end


function handle(r)
    local query, query_multi = r:parseargs()
    local path = query['path']
    local error_code = query['error_code']

    -- Setup the defaults
    r.content_type = "text/html"
    r.status = 200

    -- Deal with error codes
    if error_code == '401' then
        r.status = 401
        r:puts(template.Base:new('Unauthorized', 'Unauthorized'):render())
        return apache2.OK
    end

    -- Connect to the database only for paths that require it
    local dbh
    local dbh_err
    if path == '/db' or (path == '/login' and r.method == 'POST') or path == '/logout' then
        dbh, dbh_err = r:dbacquire("mod_dbd")
        if dbh_err then
            local err_msg = 'Could not acquire a db connection'
            r:debug(err_msg .. ': ' .. dbh_err)
            r.status = 500
            r:puts(template.Error:new(err_msg):render())
            return apache2.OK
        end
    end

    -- Render the page or an error
    local success, result = pcall(handle_paths, r, path, dbh)
    if not success then
        r:err('Error ' .. path)
        r.status = 500
        r:puts(template.Error:new('Internal server error'):render())
        return apache2.OK
    end

    -- Close the database connection if it was opened
    if dbh then
        dbh:close()
    end

    -- Return the result
    if result ~= apache2.OK then
        r:err('Path ' .. path .. ' returned ' .. tostring(result) .. ' but we expected ' .. tostring(apache2.OK))
    end
    return apache2.OK
end
