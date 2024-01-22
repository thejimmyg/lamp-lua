-- local function verify_password(username, password)
--     local htpasswd_cmd = string.format("htpasswd -bv /path/to/.htpasswd %s %s", username, password)
--     local handle = io.popen(htpasswd_cmd)
--     local result, _, exit_code = handle:close()
-- 
--     return exit_code == 0
-- end
-- 
function handle(r)
    r.content_type = "text/html"
    r:puts('<form method="POST"  action="">Username: <input type="text" name="httpd_username" />Password: <input type="httpd_password" name="httpd_password" /><input type="submit" value="Login" /></form>')
    return apache2.OK

    -- r.content_type = "text/html"
    -- if r.method == 'POST' then
    --     local httpd_username = r:parsebody()["httpd_username"]
    --     local httpd_password = r:parsebody()["httpd_password"]

    --     local dbh = r:dbacquire("database_pool_name")
    --     local statement = dbh:prepare("user_httpd_password")
    --     local res, err = statement:selectone(httpd_username)

    --     if res and verify_httpd_password(httpd_username, httpd_password) then
    --         -- Authentication successful
    --         r:puts("Login successful")
    --         -- Implement session handling and redirection
    --     else
    --         -- Authentication failed
    --         r:puts("Login failed")
    --     end

    --     dbh:close()
    -- else
    --     -- Display login form
    --     r:puts('<form method="POST">Username: <input type="text" name="httpd_username" />Password: <input type="httpd_password" name="httpd_password" /><input type="submit" value="Login" /></form>')
    -- end

    -- return apache2.OK
end
