local bcrypt = require('bcrypt')
local template = require('template')


function handle(r)
    if r.method == 'GET' then
        r.content_type = "text/html"
        local form = template.HTML:new([[
<form method="POST" action="">
  Username: <input type="text" name="httpd_username"><br>
  Password: <input type="password" name="httpd_password"><br>
  <input type="submit" value="Login">
</form>]])
        r:puts(template.Base:new('Login', form):render())
        return apache2.OK
    elseif r.method == 'POST' then
        local POST, POSTMULTI = r:parsebody()
        for k,v in pairs(POST) do
            r:debug('POST ' .. k .. ', ' .. v)
        end
        local username = POST['httpd_username']
        local password = POST['httpd_password']
        r:debug(username .. ' - ' .. password)

        local dbh, err = r:dbacquire("mod_dbd")
        if err then
            r:debug('Could not acquire a connection: ' .. err)
            return 500
        end

        local password_hash = get_password_hash(r, dbh, username)
        r:debug('Actual password hash: ' .. password_hash)
        r:debug("Lua version: " .. _VERSION)

        local result = bcrypt.verify(password, normalize_bcrypt_hash(password_hash))

        if result then
            local session_id = generate_secure_session_id()
            r:debug('session id: ' .. session_id)
            r.headers_out['Set-Cookie'] = "session=" .. session_id .. "; Path=/; HttpOnly; SameSite=Lax"
            local expiry = (os.time() + 1000) * 1000
            create_session(r, dbh, session_id, username, expiry)
            -- Could redirect to /private/ now?
            r:puts('ok')
            return apache2.OK
        else
            r:debug("Verify failed: " .. password .. ', ' .. password_hash)
            r:debug('NO SESSION ID')
            return apache2.HTTP_UNAUTHORIZED
        end
    end
end


function get_password_hash(r, dbh, username)
    local statement, err = dbh:prepared(r, "check_password")
    if err then
        r:debug('Could not get the check password statement: ' .. err)
        return 500
    end
    local res, err = statement:select(username)
    if err then
        r:debug('Could not get execute the select statement: ' .. err)
        return 500
    end
    local row = res(1)
    for k,v in pairs(row) do
        r:debug('row ' .. k .. ', ' .. v)
    end
    return row[1]
end


function normalize_bcrypt_hash(hash)
    return hash:gsub("^%$2y%$", "$2b$")
end


function generate_secure_session_id()
    local randomBytes = io.open("/dev/urandom", "rb"):read(32) -- Read 16 bytes (128 bits) from /dev/urandom
    return randomBytes:gsub('.', function(c)
        return string.format('%02x', string.byte(c))
    end)
end


function create_session(r, dbh, session, username, expiry)
    local statement, err = dbh:prepared(r, "insert_session")
    if err then
        r:debug('Could not get the insert session statement: ' .. err)
        return 500
    end
    r:debug('Got insert_session prepared statement')
    local affectedrows, err = statement:query(session, username, expiry)
    if err then
        r:debug('Could not get execute the insert session select statement: ' .. err)
        return 500
    end
    if affectedrows then
        r:debug('Successfully put the session into the database')
        return apache2.OK
    else
        r:debug('No data was returned after putting the session into the database')
    end
end
