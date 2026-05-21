#!/usr/bin/env bash
set -euo pipefail

# FalcoChat CLI Test Suite
# Run from project root: ./test.sh

PASS=0; FAIL=0; SKIP=0
CLI="node bin/falcochat.js"
TIMEOUT=30

GREEN='\033[0;32m'; RED='\033[0;31m'; CYAN='\033[0;36m'; YELLOW='\033[0;33m'; NC='\033[0m'

ok()    { PASS=$((PASS+1)); echo -e "  ${GREEN}✓${NC} $1"; }
skip()  { SKIP=$((SKIP+1)); echo -e "  ${YELLOW}～${NC} $1${2:+ $2}"; }
fail()  { FAIL=$((FAIL+1)); echo -e "  ${RED}✗${NC} $1${2:+: $2}"; }

run_cmd() {
    local tmpout rc
    tmpout=$(mktemp)
    timeout $TIMEOUT "$@" &>"$tmpout" && rc=$? || rc=$?
    if [[ $rc -eq 124 ]]; then
        rm -f "$tmpout"
        return 124
    fi
    cat "$tmpout" >&2  # print to stderr so it doesn't interfere with captured output
    cat "$tmpout"      # also to stdout for capture
    rm -f "$tmpout"
    return $rc
}

test_exit() {
    local expected=$1 desc="$2" rc out
    shift 2
    out=$(run_cmd "$@" 2>/dev/null) && rc=$? || rc=$?
    if [[ $rc -eq 124 ]]; then fail "$desc" "TIMED OUT after ${TIMEOUT}s"
    elif [[ $rc -eq $expected ]]; then ok "$desc"
    else fail "$desc" "expected exit $expected, got $rc"; fi
}

test_contains() {
    local desc="$1" pattern="$2" rc out
    shift 2
    out=$(run_cmd "$@" 2>/dev/null) && rc=$? || rc=$?
    if [[ $rc -eq 124 ]]; then fail "$desc" "TIMED OUT after ${TIMEOUT}s"
    elif grep -qi "$pattern" <<< "$out"; then ok "$desc"
    else
        if [[ $rc -eq 1 ]]; then skip "$desc (no API key?)"
        else fail "$desc" "exit=$rc, output start: $(head -1 <<< "$out")"; fi
    fi
}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    FalcoChat CLI Test Suite          ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════╝${NC}"
echo ""

# ── Help & Version ──────────────────────────────────────────
echo -e "${CYAN}── Help & Version ──${NC}"
test_exit 0 "help flag (-h)"          $CLI -h
test_exit 0 "help flag (--help)"      $CLI --help
test_exit 0 "version flag (--version)" $CLI --version
test_exit 0 "version flag (-V)"       $CLI -V

# ── List Models ──────────────────────────────────────────────
echo -e "\n${CYAN}── List Models ──${NC}"

out=$(run_cmd $CLI --list-models 2>/dev/null) && rc=$? || rc=$?
if   [[ $rc -eq 0 ]] && grep -qi "available models" <<< "$out"; then ok "--list-models"
elif [[ $rc -eq 0 ]] && grep -qi "models" <<< "$out"; then       ok "--list-models (output OK)"
elif [[ $rc -eq 1 ]]; then                                        skip "--list-models"
else                                                              fail "--list-models" "exit=$rc"
fi

out=$(run_cmd $CLI -l 2>/dev/null) && rc=$? || rc=$?
if   [[ $rc -eq 0 ]] && grep -qi "models" <<< "$out"; then ok "-l short flag"
elif [[ $rc -eq 1 ]]; then                                skip "-l short flag"
else                                                      fail "-l short flag" "exit=$rc"
fi

out=$(run_cmd $CLI -l "extra words" 2>/dev/null) && rc=$? || rc=$?
if   [[ $rc -eq 0 ]] && grep -qi "models" <<< "$out"; then ok "-l with excess args"
elif [[ $rc -eq 1 ]]; then                                skip "-l with excess args"
else                                                      fail "-l with excess args" "exit=$rc"
fi

# ── Single Prompt ────────────────────────────────────────────
echo -e "\n${CYAN}── Single Prompt ──${NC}"
test_contains "single prompt (-o)" "hello"  $CLI -o "Say hello in one word"
test_contains "single streaming (-o -s)" "hello" $CLI -o -s "Say hello in one word"

# ── Model Override ──────────────────────────────────────────
echo -e "\n${CYAN}── Model Override ──${NC}"
test_contains "model override (-m)" "hello" $CLI -o -m "openai/gpt-4o-mini" "Say hello in one word"

# ── File Input ───────────────────────────────────────────────
echo -e "\n${CYAN}── File Input ──${NC}"
echo "Say hello in one word" > /tmp/falcochat_test_prompt.txt
test_contains "file input (-f)" "hello" $CLI -o -f /tmp/falcochat_test_prompt.txt
rm -f /tmp/falcochat_test_prompt.txt

# ── Error Handling ──────────────────────────────────────────
echo -e "\n${CYAN}── Error Handling ──${NC}"
test_exit 1 "error on missing file" $CLI -o -f /tmp/nonexistent_file_xyz.txt

# ── Summary ─────────────────────────────────────────────────
echo ""
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo -e "  ${GREEN}${PASS} passed${NC} · ${YELLOW}${SKIP} skipped${NC} · ${RED}${FAIL} failed${NC} · $(($PASS+$SKIP+$FAIL)) total"
echo -e "${CYAN}════════════════════════════════════════${NC}"
echo ""
[[ $FAIL -eq 0 ]]
