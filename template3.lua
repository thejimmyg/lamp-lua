HTMLString = {}
HTMLString.__index = HTMLString

function HTMLString:new(s)
    local newObj = setmetatable({}, self)
    newObj.str = s or ""
    return newObj
end

function escape_html(str)
    local map = {["&"] = "&amp;", ["<"] = "&lt;", [">"] = "&gt;", ['"'] = "&quot;", ["'"] = "&#39;"}
    return (str:gsub('[&<>"\']', map))
end

function HTMLString:__concat(other)
    if getmetatable(other) ~= HTMLString then
        other = escape_html(tostring(other))
    else
        other = other.str
    end
    if getmetatable(self) ~= HTMLString then
        self = escape_html(tostring(self))
    else
        self = self.str
    end
    return HTMLString:new(self .. other)
end
function HTMLString:render()
    return self.str
end
local myHtml1 = HTMLString:new("<p>")
local myHtml2 = HTMLString:new("</p>")
local content = "This is <b>bold</b> text"

local finalHtml = myHtml1 .. content .. myHtml2
print(finalHtml:render())



BaseTemplate = {}
BaseTemplate.__index = BaseTemplate

function BaseTemplate:new()
    local newObj = setmetatable({}, self)
    return newObj
end

function BaseTemplate:header()
    return HTMLString:new("<header>Default Header</header>")
end

function BaseTemplate:footer()
    return HTMLString:new("<footer>Default Footer</footer>")
end

function BaseTemplate:body()
    return HTMLString:new("Default Body")
end

function BaseTemplate:render()
    return self:header() .. self:body() .. self:footer()
end


ChildTemplate = setmetatable({}, BaseTemplate)

function ChildTemplate:new()
    local newObj = setmetatable(BaseTemplate:new(), self)
    self.__index = self
    return newObj
end

function ChildTemplate:header()
    return HTMLString:new("<header>Custom Header</header>")
end

function ChildTemplate:body()
    return HTMLString:new("Custom Body")
end

local baseTemplate = BaseTemplate:new()
local childTemplate = ChildTemplate:new()

print(baseTemplate:render():render())
print(childTemplate:render():render())

