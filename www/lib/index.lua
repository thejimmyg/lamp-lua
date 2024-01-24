function handle(r)
    r:puts('<!--#include virtual="/include/top.shtml" -->')
    r:puts('   <title>Home</title>')
    r:puts('<!--#include virtual="/include/body.shtml" -->')
    r:puts('   <header>')
    r:puts('     Home')
    r:puts('   </header>')
    r:puts('   <input type="checkbox" id="menu-toggle" class="menu-toggle" />')
    r:puts('   <label for="menu-toggle" class="menu-icon">')
    r:puts('     <span></span> <!-- This represents the middle line of the hamburger -->')
    r:puts('   </label>')
    r:puts('   <nav>')
    r:puts('     <a href="/" id="nav-home-link">Home</a><br>')
    r:puts('     <a href="/db" id="nav-db-link">DB</a><br>')
    r:puts('     <a href="/404" id="nav-example-404-link">Not Found</a>')
    r:puts('   </nav>')
    r:puts('   <article>')
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
    r:puts('   </article>')
    r:puts('   <footer>Footer</footer>')
    r:puts('<!--#include virtual="/include/bottom.shtml" --> ')
    r.content_type = "text/html"  -- Sets the Content-Type header to text/html
    return apache2.OK
end

--<?php
--require './config.php';
--
--$filename = isset($_GET["filename"]) ? $_GET["filename"] : '';
--switch ($filename) {
--    case '':
--	$PAGE_TITLE = "Home";
--        include (PATH_TO_LIB . '/tpl/home.php');
--        break;
--
--    case 'db':
--	$PAGE_TITLE = "DB";
--        include (PATH_TO_LIB . '/inc/db.php');
--        include (PATH_TO_LIB . '/tpl/db.php');
--        break;
--
--    default:
--	$PAGE_TITLE = "Not Found";
--        header('HTTP/1.1 404 Not Found');
--        include (PATH_TO_LIB . '/tpl/404.php');
--        break;
--}


-- <?php
-- include (PATH_TO_LIB . '/partial/1.php');
-- if ($json) {
--     $stmt = $conn->prepare("SELECT JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
--     $n = 1;
--     $stmt->bind_param("s",  $json); // "s" means that $json is bound as a string
--     $stmt->execute();
--     $stmt->bind_result($out_json);
--     while ($stmt->fetch()) {
--       echo htmlspecialchars($out_json, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5);
--       break;
--     }
-- } else {
--     $sql = "SELECT '{\"hello\": \"world\"}' as json;" ; //JSON_ARRAYAGG(SCHEMA_NAME) as json FROM INFORMATION_SCHEMA.SCHEMATA";
--     $result = $conn->query($sql);
--     if ($result->num_rows > 0) {
--         while($row = $result->fetch_assoc()) {
--             echo htmlspecialchars($row["json"], ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5);
--     	break;
--         }
--     } else {
--         echo "{}";
--     }
-- }
-- include (PATH_TO_LIB . '/partial/2.php');


-- <?php
-- include (PATH_TO_LIB . '/partial/1.php');
-- echo 'Not Found';
-- include (PATH_TO_LIB . '/partial/2.php');
