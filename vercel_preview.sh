current_branch=$(git rev-parse --abbrev-ref HEAD)

if [[ "$current_branch" == "main" || "$current_branch" == "master" ]]; then
  	echo "✅ - Build can proceed"
    exit 1
else
  	echo "🛑 - Build cancelled"
    exit 0
fi
