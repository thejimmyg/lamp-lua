local bcrypt = require('bcrypt')
local template = require('template')


local function get_password_hash(r, dbh, username)
    local statement = assert(dbh:prepared(r, "check_password"))
    local res = assert(statement:select(username))
    local row = res(1)
    if row then
        return row[1]
    end
    return nil
end


local function normalize_bcrypt_hash(hash)
    return hash:gsub("^%$2y%$", "$2b$")
end


local function generate_secure_session_id()
    local randomBytes = io.open("/dev/urandom", "rb"):read(32) -- Read 16 bytes (128 bits) from /dev/urandom
    return randomBytes:gsub('.', function(c)
        return string.format('%02x', string.byte(c))
    end)
end


local function create_session(r, dbh, session, username, expiry)
    local statement = assert(dbh:prepared(r, "insert_session"))
    local affectedrows = assert(statement:query(session, username, expiry))
    if affectedrows then
        r:debug('Successfully put the session into the database')
    else
        r:debug('No data was returned after putting the session into the database')
    end
end


local form = template.HTML:new([[
<p>Login</p>

<form method="POST" action="">
  Username: <input type="text" name="httpd_username"><br>
  Password: <input type="password" name="httpd_password"><br>
  <input name="login" type="submit" value="Login">
</form>]])


local function handle(r, dbh)
    if r.method == 'GET' then
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
        --local result, err = pcall(login, username, password)

        local password_hash = get_password_hash(r, dbh, username)
        if not password_hash then
            r:debug('No password hash for user: ' ..username)
            r:puts(template.Base:new('Login', form):render())
            return apache2.OK
        end
        r:debug('Actual password hash: ' .. password_hash)
        local result = bcrypt.verify(password, normalize_bcrypt_hash(password_hash))
        if not result then
            r:debug("Verify failed: " .. password .. ', ' .. password_hash)
            r:debug('NO SESSION ID')
            r:puts(template.Base:new('Login', form):render())
            return apache2.OK
        end
        local session_id = generate_secure_session_id()
        r:debug('session id: ' .. session_id)
        r.headers_out['Set-Cookie'] = "session=" .. session_id .. "; Path=/; HttpOnly; SameSite=Lax"
        local expiry = (os.time() + 1000) * 1000
        create_session(r, dbh, session_id, username, expiry)
        r.status = 302
        r.headers_out['Location'] = '/private'
        r:puts(template.Base:new('Redirecting', 'Redirecting to /private.'):render())
        return apache2.OK
    end
end


local M = {handle=handle}
return M
