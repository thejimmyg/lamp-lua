local template = require('template')


local function handle(r, dbh)
    local statement = assert(dbh:prepared(r, "index"))
    local res = assert(statement:select())
    local data = res(1)[1]
    assert(data, 'No data from database')
    r:puts(template.Base:new('DB', data):render())
    return apache2.OK
end


local M = {handle = handle}
return M
