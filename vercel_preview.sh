current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $current_branch"

if [[ "$current_branch" == "main" ]]; then
  	echo "✅ - Build can proceed"
    exit 1
else
  	echo "🛑 - Build cancelled"
    exit 0
fi
