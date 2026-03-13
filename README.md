# QuickMap

FE:
- [input bar] take in the url + [submit button]
- [google maps] display with the optimized route highlighted
- [filter/ radio boxes] select with the search result
- [optional] allow users to click on the map and then get the best optimized routes
- [optional] for debugging purpose, print out a table for all routes

BE (do you want to do it in Python):
- [crawler] a way to scrap down the whole pages by accessing the url
- [parser] parse out all of the possible addresses (the really tricky part - do you want to call any other libs for this)
- [algo] based on the central location(s), how to get the shortest path - efficiently find the shortest path in Python now I guess


Food for thoughts:
[Engineering]
- How flexible is the Google Maps calls? For starters, search with 5 results at the same time + 1 central point
- If the list is relatively long, is there an efficient way to make calls?
- Do I need a server for this to support differect sites accessing?
- Dockerize it or not? Where to deploy? (definitely get it up and running on github pages tho)
- UTF-8?


[Algo Design]
- Should I design or combine some of the TSP algo? How to make it efficiently according to the input nodes?
- How to make the parser more flexible? Or have an intermediate solution for users to input certain text files?

[TDD]

=> Map
- ONLY one central point + 1-5 input locations
- ONLY one central point + 100+ input locations
- 2 central points + 1-5 input locations (consider it as two locations need to be connected in the same routes, return the shortest)
- 2 central points + 100+ input locations

=> Parser
- with indices
- pure text, but can be defined by its post code
- detect by certain keywords: "location", "stores"

https://github.com/datamade/usaddress

https://medium.com/@IndianGuru/using-google-geocoding-and-street-view-image-apis-with-go-b67bb4841ff0

bump up for visi
