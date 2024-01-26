local template = require('template')

function handle(r)
    local QUERY, QUERY_MULTI = r:parseargs()
    local path = QUERY['path']
    r.status = 200
    r.content_type = "text/html"  -- Sets the Content-Type header to text/html
    if path == '/' then
        r:puts(template.Base:new('Home', 'Home'):render())
    elseif path == '/db' then
        r:puts(template.Base:new('DB', index(r)):render())
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
    return apache2.OK
end

function index(r)
    local dbh, err = r:dbacquire("mod_dbd")
    if err then
        r:debug('Could not acquire a connection: ' .. err)
        return 500
    end
    local statement, err = dbh:prepared(r, "index")
    if err then
        r:debug('Could not get the index prepared statement: ' .. err)
        return 500
    end
    local res, err = statement:select()
    if err then
        r:debug('Could not get execute the index select statement: ' .. err)
        return 500
    end
    local row = res(1)
    for k,v in pairs(row) do
        r:debug('row ' .. k .. ', ' .. v)
    end
    dbh:close()

    local json = row[1]
    r:debug('Got JSON: ' .. json)
    return json
end
