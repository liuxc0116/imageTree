# Imagetree

Image Tree base on zrender.

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/liuxc0116/imageTree/master/dist/zrender.imageTree.min.js
[max]: https://raw.github.com/liuxc0116/imageTree/master/dist/zrender.imageTree.js

In your web page:

```html
<script src="js/zrender.min.js" type="text/javascript"></script>
<script src="dist/zrender.imageTree.js"></script> 
<script>
    var data = {"title":"", "data": []};
    window.onload = function() {
        var t = new imageTree(document.getElementById("main"), document.getElementById('showText'), true, null, 100);
        t.render(data);
        //setTimeout(function() {t.reload(data)}, 5000);
    }
</script>
```

## Documentation
_(Coming soon)_

## Examples
_(Coming soon)_

## Release History
_(Nothing yet)_
