# Help develop this library

## Update `res/interval_conditional.txt`

This file contains all existing syntax of `interval:conditional=*` tag in OpenStreetMap. This can be generated using the `npm run build:values` command, or manually following these steps.

### Export raw values using Overpass Turbo

Go on [Overpass Turbo](https://overpass-turbo.eu) and run this query.

```
[out:csv("interval:conditional")][timeout:25];
(
  relation["interval:conditional"];
);
out body;
```

As a result, you have all values extracted from OSM. You can copy/paste the whole result into file `res/overpass_values.txt`.

### Filter and sort

Using Linux command tools, we can clean-up the data from Overpass.

```bash
cat res/overpass_values.txt | tail -n +2 | sort | uniq | sed 's/^"//g;s/"$//g' > res/interval_conditional.txt
```

And that's all !
