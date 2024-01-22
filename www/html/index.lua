function handle(r)
    local database, err = r:dbacquire("mod_dbd")
    if not err then
        local statement, errmsg = database:prepared(r, "james")
        if not errmsg then
            local results, errmsg = statement:select()
            if not err then
                local rows = results(0) -- fetch all rows synchronously
                for k, row in pairs(rows) do
                    r:puts( string.format("Name: %s<br/>", row[1]))
                end
            else
                r:puts("Database query error: " .. err)
            end
        end
        database:close()
    else
        r:puts("Could not connect to the database: " .. err)
    end
end
