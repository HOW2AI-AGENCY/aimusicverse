import re

with open('src/pages/Library.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# --- Conflict 2 (lines 346-422) ---
# Keep sticky (HEAD) but merge incoming's Search className + input classes
line2_start = content.find('<<<<<<< HEAD\n              {/* Sticky Search')
line2_end = content.find('>>>>>>> 00e54f12ba8223a5d24906d42f012d3ea87d0954\n                    </div>')
line2_end += len('>>>>>>> 00e54f12ba8223a5d24906d42f012d3ea87d0954\n                    </div>')

new2 = (
    '<div className="sticky top-0 z-10 bg-background border-b border-border/30 -mx-4 px-5 sm:px-6 py-4 sm:py-5">\n'
    '                {isMobile ? (\n'
    '                  <CompactFilterBar\n'
    '                    searchQuery={searchQuery}\n'
    '                    onSearchChange={setSearchQuery}\n'
    '                    activeFilter={typeFilter}\n'
    '                    onFilterChange={setTypeFilter}\n'
    '                    sortBy={sortBy}\n'
    '                    onSortChange={setSortBy}\n'
    '                    statusFilter={statusFilter}\n'
    '                    onStatusFilterChange={setStatusFilter}\n'
    '                    counts={filterCounts}\n'
    '                  />\n'
    '                ) : (\n'
    '                  <div className="flex flex-col gap-2">\n'
    '                    <div className="flex gap-2">\n'
    '                      <div className="relative flex-1 group">\n'
    '                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 group-focus-within:text-primary" />\n'
    '                        <Input\n'
    '                          type="search"\n'
    '                          aria-label="Поиск треков"\n'
    '                          placeholder="Поиск..."\n'
    '                          value={searchQuery}\n'
    '                          onChange={(e) => setSearchQuery(e.target.value)}\n'
    '                          className="pl-8 h-8 text-xs rounded-md border-border/50 bg-card/50 focus:bg-card"\n'
    '                        />\n'
    '                      </div>\n'
    '                      <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>\n'
    '                        <SelectTrigger className="w-32 h-8 text-[11px] rounded-md border-border/50 bg-card/50">\n'
    '                          <SlidersHorizontal className="w-3 h-3 mr-1 text-muted-foreground" />\n'
    '                          <SelectValue />\n'
    '                        </SelectTrigger>\n'
    '                        <SelectContent className="rounded-md">\n'
    '                          <SelectItem value="recent" className="text-xs">\n'
    '                            Недавние\n'
    '                          </SelectItem>\n'
    '                          <SelectItem value="popular" className="text-xs">\n'
    '                            Популярные\n'
    '                          </SelectItem>\n'
    '                          <SelectItem value="liked" className="text-xs">\n'
    '                            Любимые\n'
    '                          </SelectItem>\n'
    '                        </SelectContent>\n'
    '                      </Select>\n'
    '                    </div>'
)

new2_with_header = '              {/* Sticky Search and Filters — secondary nav for large libraries */}\n' + new2

content = content[:line2_start] + new2_with_header + content[line2_end:]

# --- Conflict 3 (lines 466-518): indentation + extra content ---
line3_start = content.find('<<<<<<< HEAD\n                {/* Active Generations Section */}')
line3_end = content.find('>>>>>>> 00e54f12ba8223a5d24906d42f012d3ea87d0954\n                    <div')
insert_point = content.index('                    <div', line3_start)
line3_end = insert_point  # we keep HEAD's close + incoming's VirtualizedTrackList

# Extract HEAD's close after the header
head_section = content[line3_start + len('<<<<<<< HEAD\n'):content.index('=======', line3_start)]
# Extract incoming's VirtualizedTrackList + skeleton
incoming_section = content[content.index('=======\n', line3_start) + len('=======\n'):line3_end]
# Remove merge markers from incoming
incoming_section = incoming_section.replace('>>>>>>> 00e54f12ba8223a5d24906d42f012d3ea87d0954\n', '')
# The merge headers already include the close + skeleton loading + VirtualizedTrackList
# Extract the new content from incoming (everything after Active section content)
incoming_parts = incoming_section.split('              {/* Track List Content */}\n')
if len(incoming_parts) > 1:
    incoming_new = incoming_parts[1]
else:
    incoming_new = incoming_section

# Build resolved version:
# HEAD's Active Gen section header + grid container + generating items
head_lines = head_section.split('\n')
# Find where HEAD's Active Generations closing tags start
close_start = None
for i, l in enumerate(head_lines):
    if '})' in l and i > 5:
        close_start = i
        break

if close_start:
    head_active_header = '\n'.join(head_lines[:close_start])
    # Find incoming's active section (has the grid container)
    incoming_lines = incoming_section.split('\n')
    # Find the grid container part
    grid_start = None
    for i, l in enumerate(incoming_lines):
        if 'viewMode === "grid"' in l:
            grid_start = i - 1  # the <div before it
            break
    # Find end of active generations section
    active_end = None
    for i in range(grid_start, len(incoming_lines)):
        if '})' in incoming_lines[i] and i > grid_start + 5:
            active_end = i + 1  # include the closing )
            break

    if grid_start and active_end:
        active_mid = '\n'.join(incoming_lines[grid_start:active_end])
        resolved_active = head_active_header + '\n' + active_mid
    else:
        resolved_active = head_section
else:
    resolved_active = head_section

# Now build the full replacement
resolved = resolved_active + '\n'

# Add HEAD's close of active generations
resolved += '                  </div>\n'
resolved += '                )\n'
resolved += '\n'
resolved += '              {/* Track List Content */}\n'

# Now add the VirtualizedTrackList part from incoming
# Find the VirtualizedTrackList in incoming
vtl_start = incoming_section.find('<VirtualizedTrackList')
if vtl_start >= 0:
    resolved += incoming_section[vtl_start:]

# Also add the closing part for the section
resolved += '\n                    <div'

content = content[:insert_point] + '\n' + resolved

# Clean up: if there's still merge marker text, remove it
content = content.replace('<<<<<<< HEAD', '').replace('=======', '').replace('>>>>>>> 00e54f12ba8223a5d24906d42f012d3ea87d0954', '')

remaining = re.findall(r'<<<<<<< |=======\n|>>>>>>> ', content)
print(f"Remaining markers: {len(remaining)}")

with open('src/pages/Library.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
