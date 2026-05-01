Output actonce-spend-demo.gif
Set FontSize 24
Set Width 1200
Set Height 700
Set Theme "Dracula"
Set Shell zsh
Set TypingSpeed 50ms

# Setup: make sure we are in the right directory and policy exists
Type "cd /Users/hendrixclaw/.openclaw/workspace/build/actonce-spend-gateway"
Enter
Sleep 500ms

Type "clear"
Enter
Sleep 200ms

Type "# ActOnce Spend Gateway — 30 Second Demo"
Enter
Sleep 500ms

Type "actonce-spend init"
Enter
Sleep 2s

Type "# Policy created. Now let's test a spend..."
Enter
Sleep 500ms

Type "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --reason 'Domain for client project' --simulate"
Enter
Sleep 3s

Type "# Dry run approved. Now for real..."
Enter
Sleep 500ms

Type "actonce-spend check --amount 14.99 --currency GBP --merchant namecheap.com --reason 'Domain for client project'"
Enter
Sleep 3s

Type "# Under budget — auto-approved. Let's test the approval boundary..."
Enter
Sleep 500ms

Type "actonce-spend check --amount 149.99 --currency GBP --merchant aws.amazon.com --reason 'EC2 instance for testing'"
Enter
Sleep 3s

Type "# Requires approval — queued. Let's see the queue..."
Enter
Sleep 500ms

Type "actonce-spend pending"
Enter
Sleep 2s

Type "# Approve it manually..."
Enter
Sleep 500ms

Type "actonce-spend approve actonce_txn_..."
Backspace Backspace Backspace
Sleep 500ms

Type "# Let's check the logs instead..."
Enter
Sleep 500ms

Type "actonce-spend logs --last 5"
Enter
Sleep 3s

Type "# Every decision logged with timestamp, reason, and context."
Enter
Sleep 500ms

Type "# Install: npm install -g @actonce/spend-gateway"
Enter
Sleep 500ms

Type "# github.com/PerryTheImp/actonce-spend-gateway"
Enter
Sleep 2s
