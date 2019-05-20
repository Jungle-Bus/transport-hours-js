# Help develop this library

## Update `res/interval_conditional.txt`

This file contains all existing syntax of `interval:conditional=*` tag in OpenStreetMap. This can be generated following these steps.

### Export raw values using Overpass Turbo

Go on [Overpass Turbo](https://overpass-turbo.eu) and run this query.

```
[out:csv("interval:conditional")][timeout:25];
(
  // query part for: “"interval:conditional"=*”
  node["interval:conditional"];
  way["interval:conditional"];
  relation["interval:conditional"];
);
out body;
```

As a result, you have all values extracted from OSM.

### Filter and sort

Using Linux command tools, we can clean-up the data from Overpass.

```bash
cat overpass_values.txt | sort | uniq > interval_conditional.txt
```

And that's all !
