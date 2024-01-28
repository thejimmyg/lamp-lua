local template = require('template')


local function handle(r, dbh)
    local session_id = r:getcookie('session')
    r.err_headers_out['Set-Cookie'] = "session=" .. '' .. "; Path=/; HttpOnly; SameSite=Lax; Max-Age=1"
    local statement = assert(dbh:prepared(r, "delete_session"))
    r:debug('Got delete_session prepared statement')
    local affectedrows = assert(statement:query(session_id))
    if affectedrows then
        r:debug('Successfully deleted the session from the database')
    else
        r:debug('No session was deleted so the user is logged out anyway')
    end
    r:puts(template.Base:new('Logged Out', 'Logged out successfully.'):render())
    return apache2.OK
end


local M = {handle=handle}
return M
