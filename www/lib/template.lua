local HTML = {}
HTML.__index = HTML

function HTML:new(s)
    local newObj = setmetatable({}, self)
    newObj.str = s or ""
    return newObj
end

local function escape_html(str)
    local map = {["&"] = "&amp;", ["<"] = "&lt;", [">"] = "&gt;", ['"'] = "&quot;", ["'"] = "&#39;"}
    return (str:gsub('[&<>"\']', map))
end

function HTML:__concat(other)
    if getmetatable(other) ~= HTML then
        other = escape_html(tostring(other))
    else
        other = other.str
    end
    if getmetatable(self) ~= HTML then
        self = escape_html(tostring(self))
    else
        self = self.str
    end
    return HTML:new(self .. other)
end

function HTML:render()
    return self.str
end


local top_shtml = HTML:new([[<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="stylesheet" href="/styles.css">
    <script src="https://unpkg.com/htmx.org@1.9.10" integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC" crossorigin="anonymous"></script>
]])


local body_shtml = HTML:new([[  </head>
  <body hx-boost="true">
]])


local bottom_shtml = HTML:new([[    <input type="checkbox" id="menu-toggle" class="menu-toggle" />
    <label for="menu-toggle" class="menu-icon">
      <span></span> <!-- This represents the middle line of the hamburger -->
    </label>
    <nav>
      <a href="/" id="nav-home-link">Home</a><br>
      <a href="/db" id="nav-db-link">DB</a><br>
      <a href="/login" id="nav-login-link">Login</a><br>
      <a href="/logout" id="nav-logout-link">Logout</a><br>
      <a href="/private/" id="nav-private-link">Private</a><br>
      <a href="/404" id="nav-example-404-link">Not Found</a>
    </nav>
    <footer>Footer</footer>
    <script>
    // Without this, error pages don't appear to the user to get loaded
    document.body.addEventListener('htmx:beforeOnLoad', function (evt) {
        if (evt.detail.xhr.status === 404 || evt.detail.xhr.status === 500) {
            evt.detail.shouldSwap = true;
            evt.detail.isError = false;
        }
    });
    </script>
  </body>
</html>]])



local Base = {}
Base.__index = Base

function Base:new(title, article)
    local newObj = setmetatable({}, self)
    newObj['title'] = title or ''
    newObj['article'] = article or "Default Article"
    return newObj
end

function Base:title_area()
    return self.title
end

function Base:header_area()
    return self.title
end

function Base:footer_area()
    return "Footer"
end

function Base:article_area()
    return self.article
end

function Base:render()
    return (
        top_shtml .. 
        HTML:new('    <title>') .. self:title_area() .. HTML:new('</title>\n') ..
        body_shtml ..
        HTML:new('    <header>') .. self:header_area() .. HTML:new('</header>\n') ..
        HTML:new('    <article>') .. self:article_area() .. HTML:new('</article>\n') ..
        HTML:new('    <footer>') .. self:footer_area() .. HTML:new('</footer>\n') ..
        bottom_shtml
    ):render()
end

-- If run on the command line:
if arg then
    local Child = setmetatable({}, Base)
    
    function Child:new(title)
        local newObj = setmetatable(Base:new(title), self)
        self.__index = self
        return newObj
    end
    
    function Child:article_area()
        return "Custom Body"
    end
    
    local baseTemplate = Base:new('Home')
    local childTemplate = Child:new('Child')
    print(baseTemplate:render())
    print(childTemplate:render())
end


-- Use as a module
local M = {
    HTML = HTML,
    Base = Base,
    top_shtml = top_shtml,
    body_shtml = body_shtml,
    bottom_shtml = bottom_shtml,
}
return M
