#!/bin/bash

###############################################################################
# Console.log Cleanup Script
# 
# Purpose: Identify and report console.* usage in Edge Functions
# Usage: ./scripts/find-console-logs.sh [--fix-file <path>]
#
# Without arguments: Reports all files with console.* calls
# With --fix-file: Provides sed commands to fix a specific file
###############################################################################

set -e

FUNCTIONS_DIR="supabase/functions"
EXCLUDE_PATTERNS="logger.ts|apiLogger.ts|node_modules"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

###############################################################################
# Function: Count console calls in a file
###############################################################################
count_console_calls() {
    local file="$1"
    grep -c "console\." "$file" 2>/dev/null || echo 0
}

###############################################################################
# Function: Find all files with console calls
###############################################################################
find_console_files() {
    echo -e "${BLUE}=== Scanning for console.* usage in Edge Functions ===${NC}\n"
    
    local total_files=0
    local files_with_console=0
    local total_console_calls=0
    
    # Find all TypeScript files
    while IFS= read -r file; do
        # Skip excluded patterns
        if echo "$file" | grep -qE "$EXCLUDE_PATTERNS"; then
            continue
        fi
        
        total_files=$((total_files + 1))
        
        local count=$(count_console_calls "$file")
        if [ "$count" -gt 0 ]; then
            files_with_console=$((files_with_console + 1))
            total_console_calls=$((total_console_calls + count))
            
            # Show file with count
            printf "${YELLOW}%-3d${NC} - %s\n" "$count" "$file"
        fi
    done < <(find "$FUNCTIONS_DIR" -name "*.ts" -type f | sort)
    
    # Summary
    echo ""
    echo -e "${BLUE}=== Summary ===${NC}"
    echo "Total TypeScript files scanned: $total_files"
    echo -e "${RED}Files with console.* calls: $files_with_console${NC}"
    echo -e "${RED}Total console.* calls: $total_console_calls${NC}"
    echo ""
    
    if [ $files_with_console -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Production code should use structured logging${NC}"
        echo "   Use: logger.info(), logger.error(), logger.warn()"
        echo "   Instead of: console.log(), console.error(), etc."
        echo ""
        echo "To fix a specific file, run:"
        echo "  $0 --fix-file <path-to-file>"
    else
        echo -e "${GREEN}✅ All files use structured logging!${NC}"
    fi
}

###############################################################################
# Function: Show how to fix a specific file
###############################################################################
show_fix_instructions() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: File not found: $file${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}=== Fix Instructions for $file ===${NC}\n"
    
    # Check if logger is already imported
    if grep -q "createLogger\|const logger\|let logger\|var logger" "$file"; then
        echo -e "${GREEN}✓ Logger already present${NC}\n"
    else
        echo -e "${YELLOW}1. Add logger import at the top:${NC}"
        echo "   Add after other imports:"
        echo "   import { createLogger } from '../_shared/logger.ts';"
        echo ""
        local func_name=$(basename $(dirname "$file"))
        echo "   const logger = createLogger('$func_name');"
        echo ""
    fi
    
    echo -e "${YELLOW}2. Replace console.* calls:${NC}\n"
    
    # Show actual console calls in the file
    local line_num=1
    while IFS= read -r line; do
        if echo "$line" | grep -q "console\."; then
            printf "   ${RED}Line %3d:${NC} %s\n" "$line_num" "$line"
            
            # Suggest replacement
            local replacement=""
            if echo "$line" | grep -q "console\.log"; then
                replacement=$(echo "$line" | sed 's/console\.log/logger.info/g')
            elif echo "$line" | grep -q "console\.error"; then
                replacement=$(echo "$line" | sed 's/console\.error/logger.error/g')
            elif echo "$line" | grep -q "console\.warn"; then
                replacement=$(echo "$line" | sed 's/console\.warn/logger.warn/g')
            elif echo "$line" | grep -q "console\.info"; then
                replacement=$(echo "$line" | sed 's/console\.info/logger.info/g')
            fi
            
            if [ -n "$replacement" ]; then
                echo "   ${GREEN}  Replace with:${NC} $replacement"
            fi
            echo ""
        fi
        line_num=$((line_num + 1))
    done < "$file"
    
    echo -e "${YELLOW}3. Convert to structured logging:${NC}"
    echo "   Instead of: console.log('Message', var1, var2)"
    echo "   Use:        logger.info('Message', { var1, var2 })"
    echo ""
    echo "   Benefits:"
    echo "   - Log levels (info/warn/error)"
    echo "   - Structured metadata"
    echo "   - No sensitive data leaks"
    echo "   - Better filtering and search"
    echo ""
    
    # Show sed commands for automated replacement
    echo -e "${BLUE}4. Automated sed commands:${NC}"
    echo ""
    echo "   # Replace console.log"
    echo "   sed -i 's/console\.log/logger.info/g' $file"
    echo ""
    echo "   # Replace console.error"  
    echo "   sed -i 's/console\.error/logger.error/g' $file"
    echo ""
    echo "   # Replace console.warn"
    echo "   sed -i 's/console\.warn/logger.warn/g' $file"
    echo ""
    echo "   # Replace console.info"
    echo "   sed -i 's/console\.info/logger.info/g' $file"
    echo ""
    echo -e "${RED}⚠️  Warning: Review changes before committing!${NC}"
    echo "   - Ensure logging doesn't leak sensitive data"
    echo "   - Convert message+variables to structured format"
    echo "   - Test the function after changes"
}

###############################################################################
# Function: Show usage
###############################################################################
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --fix-file <path>    Show how to fix a specific file"
    echo "  --help, -h          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                                                    # List all files with console.*"
    echo "  $0 --fix-file supabase/functions/klangio-analyze/index.ts"
}

###############################################################################
# Main
###############################################################################
main() {
    if [ $# -eq 0 ]; then
        find_console_files
    elif [ "$1" = "--fix-file" ]; then
        if [ -z "$2" ]; then
            echo -e "${RED}Error: --fix-file requires a file path${NC}"
            show_usage
            exit 1
        fi
        show_fix_instructions "$2"
    elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        show_usage
    else
        echo -e "${RED}Error: Unknown option: $1${NC}"
        show_usage
        exit 1
    fi
}

main "$@"
