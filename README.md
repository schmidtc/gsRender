### gsRender -- Docs
#### Example

##### Step 1: Create a google map
```javascript
var mapOptions = {
        zoom: 12,
        center: new google.maps.LatLng(37.8, -122.3),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    },
    map = new google.maps.Map(document.getElementById("map"), mapOptions);
```

##### Step 2: Create a geoScore map overlay
```javascript
var overlayOptions = {
        geography: gsRender.geography.US_CENSUS_STATES_2013,
        opacity: 0.75
    },
    overlay = gsRender.maps.Overlay(overlayOptions);
```            

##### Step 3: Add the overlay to the google map
```javascript
    map.overlayMapTypes.push(overlay);   
```

##### Step 4: Customize the overlay
```javascript
    gsRender.api.variable({
        geography: gsRender.geography.US_CENSUS_STATES_2013,
        variable: "B19013" // Median Household Income
    }).then(function(data){
        overlay.setData('income', data); // optional, provides easy access to the raw data, used in step 5.
        var cl = gsRender.util.equal_interval(data, 5);
        overlay.setClassification(cl);
        overlay.setColors(gsRender.colors.RedBlue(5));
    });
```

##### Step 5: Add some interaction...
```javascript
    var info = new google.maps.InfoWindow();
    overlay.addListener('mouseover', function(event) {
        if (event.region_offset != undefined) {
            overlay.setSelection(region_offset);
            info.setOptions({
                content: "$"+overlay.getData('income')[event.region_offset],
                location: event.latlng
            });
            info.open(map);
        } else {
            overlay.clearSelection();
            info.close();
        }
    })

```

##### Complete Example:
```html
<html>
<body>
<div style="width:100%; height:500px;" id=map></div>
<script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
<script type="text/javascript" src="http://cdn.geoscore.com/js/gsRender.v1.js?apikey=API_KEY"></script>
<script>
    // Step 1
    var mapOptions = {
            zoom: 12,
            center: new google.maps.LatLng(37.8, -122.3),
            mapTypeId: google.maps.MapTypeId.ROADMAP
        },
        map = new google.maps.Map(document.getElementById("map"), mapOptions),
    // Step 2
        overlayOptions = {
            geography: gsRender.geography.US_CENSUS_STATES_2013,
            opacity: 0.75
        },
        overlay = gsRender.maps.Overlay(overlayOptions);
    // Step 3
    map.overlayMapTypes.push(overlay);

    // Step 4
    gsRender.api.variable({
        geography: gsRender.geography.US_CENSUS_STATES_2013,
        variable: "B19013" // Median Household Income
    }).then(function(data){
        overlay.setData('income', data); // optional, provides easy access to the raw data, used in step 5.
        var cl = gsRender.util.equal_interval(data, 5);
        overlay.setClassification(cl);
        overlay.setColors(gsRender.colors.RedBlue(5));
    });

    // Step 5
    var info = new google.maps.InfoWindow();
    overlay.addListener('mouseover', function(event) {
        if (event.region_offset != undefined) {
            overlay.setSelection(region_offset);
            info.setOptions({
                content: "$"+overlay.getData('income')[event.region_offset],
                location: event.latlng
            });
            info.open(map);
        } else {
            overlay.clearSelection();
            info.close();
        }
    })
</script>
</body>
</html>
```

#### Note on API KEYS
The API KEY must be included in the request for the GeoScore JavaScript Source Code.
The Javascript library will extract the key from the URL and automatically request a token from our API server.
```javascript
gsRender.api._getToken(api_key);
```
the api_key and "referrer" header will be checked and if valid a token will be returned.
the token will be used to sign all requests to CloudFront, thus protecting our Tiles from unauthorized access.
the token will also be used to aign requests to our API.

#### JavaScript Reference


##### gsRender Namespaces

gsRender.maps -- Namespace: map rendering tools and overlays
gsRender.api -- Namespace: API access to our Data, tools, etc.
gsRender.geography -- Namespace: information about available geographies.

##### gsRender.maps

###### gsRender.maps.Overlay -- returns a gsRender overlay.
  arguments: OverlayOptions -- REQUIRED -- see gsRender.maps.OverlayOptions
  
  methods: coming soon
  
###### gsRender.maps.OverlayOptions -- object
  geography -- REQUIRED -- geography id, see gsRender.geography
  classification -- Optional -- gsRender.maps.Classification (default: all 1 class)
  colorScheme -- Optional -- gsRender.maps.ColorScheme (default: random color)
  opacity -- Optional -- number between 0 and 1 (default: 1)
  
  
  
  
  
  
  
  
  
