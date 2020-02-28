@app
syntaxfm-tsx

@cdn 
@static
folder dist 

@http
get /
get /play
get /robots.txt
get /show/:number/:title
get /api/shows
get /api/shows/:number
get /api/sickpicks
post /graphql
