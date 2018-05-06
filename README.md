#QuickMap

FE: 
- [input bar] take in the url + [submit button]
- [google maps] display with the optimized route highlighted
- [filter/ radio boxes] select with the search result 
- [optional] allow users to click on the map and then get the best optimized routes
- [optional] for debugging purpose, print out a table for all routes

BE (do you want to do it in GO or Python):
- [crawler] a way to scrap down the whole pages by accessing the url
- [parser] parse out all of the possible addresses (the really tricky part - do you want to call any other libs for this)
- [algo] based on the central location(s), how to get the shortest path - efficietly find the shortest path in Python now I guess


Food for thoghts:
[Engineering]
- How flexible is the Google Maps calls? For starters, search with 5 results at the same time + 1 central point
- If the list is relatively long, is there an efficient way to make calls?
- Do I need a server for this to support differect sites accessing? 
- Dockerize it or not? Where to deploy? (definitely get it up and running on github pages tho)
- UTF-8?


[Algo Design]
- Should I design or combine some of the TSP algo? How to make it efficiently according to the input nodes?
- How to make the parser more flexible? Or have an intermidate solution for users to input certain text files?

[TDD]

=> Map
- ONLY one central point + 1-5 input locations 
- ONLY one central point + 100+ input locations 
- 2 central points + 1-5 input locations (consider it as two locations need to be connected in the same routes, return the shortest)
- 2 central points + 100+ input locations

=> Parser
- with indices 
- pure text, but can be deinfed by its post code
- detect by certain keywords: "location", "stores"

