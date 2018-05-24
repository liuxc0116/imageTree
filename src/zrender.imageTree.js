/*
 * imageTree
 * https://github.com/liuxc/imageTree
 *
 * Copyright (c) 2018 liuxc
 * Licensed under the zrender license.
 */
// JavaScript Document

(function(zrender){
    
    function Node(own, parent) {
        this.own = own;
        this.parent = parent;
        this.leaf = false;
        this.draw_able = true;
        this.pos_x = 0;
        this.zr_obj = null;
    }
    
    Node.prototype = {
        set_parent: function(data) {
            this.parent = data;
        },
        set_draw_able: function(data) {
            this.draw_able = data;
        },
        set_leaf: function(data) {
            this.leaf = data;
        },
        set_position_x: function(data) {
            this.set_pos_x;
        },
        set_zrender_obj: function(data) {
            this.zr_obj = data
        },
        copy: function() {
            var node = new Node(this.own, this.parent);
            node.set_draw_able(this.draw_able);
            node.set_leaf(this.leaf);
            node.set_position_x(this.pos_x);
            node.set_zrender_obj(this.zr_obj);
            return node;
        }
    }
    
    /*
     * 建立一个二维数组，数组的长度代表tree的层数
     * 二维数组中的元素代表属于同一层的节点
     * 叶子节点会一直填充至最底层, 如下图中的tree,各层的节点如下
     * 第一层  A
     * 第二层  B C
     * 第三层  D E F
     * 第四层  D E G
     *          A
     *       B      C
     *     D      E    F
     *                  G
     */
    var demixing = function (tree) {
        var id = 0;
        var layers = [];
        var leafs = [];

        var find_node = function(data, id) {
            for (var i = 0; i < data.length; i++) {
                var node = data[i];
                if (node.own.id__ == id) {
                    return true;
                }
            }
            return false;
        };

        var put_leaf_node_to_other = function(level) {
            for (var i = 0; i < leafs.length; i++) {
                var leaf = leafs[i];
                for (var j = level - 1; j < layers.length; j++) {
                    if (leaf.level < j) {
                        if (find_node(layers[j], leaf.node.own.id__) == false) {
                            var node = leaf.node.copy();
                            node.set_parent(leaf.node);
                            node.set_draw_able(false);
                            layers[j].push(node);
                        }
                    }
                }
            }
        }

        var action = function(tree, parent, level) {
            if (typeof layers[level] == 'undefined') {
                layers[level] = [];
            }
            for (var i = 0; i < tree.length; i++) {
                var data = tree[i];
                data.id__ =  id++;
                var node = new Node(data, parent)
                if (data.hasOwnProperty('childrens')) {
                    action(data.childrens, node, level + 1);
                } else {
                    node.set_leaf(true);
                    leafs.push({"node": node, "level": level});
                }
                put_leaf_node_to_other(level);
                layers[level].push(node);
            }
        }

        action(tree, null, 0);
        return layers;
    }
    
    /* 
     * 先画最底层，
     * 上层元素根据底层子元素得到x的坐标
     */
    var drawTreeUseMaxLeaf = function(This) {
        var layers = This.layers;
        var child_nodes = [];
        var cal_parent_pos_x = function (id, layer_index) {
            child_nodes = [];
            if (layer_index == layers.length) {
                return null;
            }
            var nodes = layers[layer_index];
            var start = 0;
            var end = 0;
            var flags = true;
            for (var i = 0; i < nodes.length; i++) {
                if (nodes[i].parent.own.id__ == id) {
                    if (flags == true) {
                        start = i;
                        flags = false;
                    }

                    if (nodes[i].draw_able == true) {
                        child_nodes.push(nodes[i]);
                    }
                    end = i;
                }
            }
            /*console.log("nodes[start].pos_x, nodes[end].pos_x = " + nodes[start].pos_x + ", " + nodes[end].pos_x + "  " + (nodes[start].pos_x + nodes[end].pos_x) / 2.0);*/
            return (nodes[start].pos_x + nodes[end].pos_x) / 2.0;
        }

        var layer_len = layers.length;
        var per_layer_height = (This.height - 100) / (layer_len - 1);
        /*if (per_layer_height > 50) {
            per_layer_height = 100;
        }*/

        for (var layer_index = layer_len - 1; layer_index >= 0; layer_index--) {
            var nodes = layers[layer_index];
            var node_len = nodes.length;
            var per_node_width = This.width / (node_len + 1);
            for (var node_index = 0; node_index < node_len; node_index++) {
                var node = nodes[node_index];
                var pos_x = cal_parent_pos_x(node.own.id__, layer_index + 1);
                if (pos_x == null) {
                    pos_x = per_node_width * (node_index + 1);
                }

                node.pos_x = pos_x;
                if (node.draw_able == false) {
                    continue;
                }

                //console.log("pos_x=" + pos_x);
                var position_x = pos_x - node.own.width / 2;
                var position_y = per_layer_height * layer_index + node.own.height / 2;
                var zr_circle = new zrender.Image({
                    position: [position_x, position_y],
                    style: {
                        image: node.own.img_src,
                        width: node.own.width,
                        height: node.own.height
                    },
                    cursor: "pointer",
                    draggable: This.draggable,
                    zlevel: 2
                });

                This.zr.add(zr_circle);
                node.set_zrender_obj(zr_circle);

                //show text
                var info = node.own.data;
                var text = "";
                for (var key in info) {
                    text += key + " = " + info[key] + "\n";
                };

                var text_position_x = position_x + node.own.width + 10;
                var text_position_y = position_y + 10;
                console.log(position_x + "," + position_y);
                console.log(text_position_x + "," + text_position_y);
                var text_width = 150;
                if (node.leaf == true) {
                    text_position_x = position_x - text_width / 2 + node.own.width / 2;
                    text_position_y = position_y + node.own.height / 2 + 10;
                }

                var zr_text = new zrender.Text({
                    position : [text_position_x, text_position_y],
                    style: {
                        text: text,
                        width: text_width,
                        //textFill: '#922889',
                        textFill: '#5d8578',
                        textFont: '10px Microsoft Yahei',
                        textLineHeight: 18,
                        rich: {
                            a: {
                                textLineHeight: 18
                            }
                        },
                        truncate: {
                            outerWidth: text_width,
                            ellipsis: "..."
                        }
                    },
                    zlevel: 4,
                    draggable: true
                }).on('mouseover', function() {
                    this.attr("style", {
                        textFill: '#55a36b',
                        truncate: {
                        }
                    });
                }).on('mouseout',function() {
                    this.attr("style", {
                        textFill: '#5d8578',
                        truncate: {
                            outerWidth: text_width,
                            ellipsis: "..."
                        }
                    });
                }).on('click', function() {
                    if (This.show_text !== null) {
                        This.show_text.innerHTML = this.style.text;
                    }
                });
                This.zr.add(zr_text);

                if (node.leaf == false) {
                    for (var i = 0; i < child_nodes.length; i++) {
                        var node_child = child_nodes[i];
                        var line = new zrender.Line({
                            shape: {
                                x1: zr_circle.position[0] + node.own.width / 2,
                                y1: zr_circle.position[1] + node.own.height / 2,
                                x2: node_child.zr_obj.position[0] + node_child.own.width / 2,
                                y2: node_child.zr_obj.position[1] + node_child.own.height / 2
                            },
                            style: {
                                fill: 'green',
                                stroke: '#4965b0',
                                lineWidth: 2
                            },
                            zlevel: 1
                        });
                        This.zr.add(line);
                    }
                }
            }
        }
    }
    
    //action is Dichotomy
    /*
     * 采用先画自己再画孩子后画兄弟的顺序
     * 子元素x坐标的确认采用平分当前父元素占画布大小的方式
     * root元素平分画布的方式确认x坐标
     */
    var drawtreeUseDichotomy = function(This, data, parent, parent_position_start, parent_width, level_index, last_image_pos_y) {
        //create tree use dichotomy
        var len = data.length;

        if (typeof parent_width == 'undefined' || parent_width == null) {
            parent_width = This.width;
        }

        if (typeof level_index == 'undefined' || level_index == null) {
            level_index = 1;
        }

        if (typeof parent_position_start == 'undefined' || parent_position_start == null) {
            parent_position_start = 0;
        }

        if (typeof last_image_pos_y == 'undefined' || last_image_pos_y == null) {
            last_image_pos_y = 0;
        } else {
            last_image_pos_y += This.pre_level_height;
        }

        var has_parent = (typeof parent !== 'undefined' && parent !== null);

        var pre_obj_width = parent_width / len;
        for (var i = 0; i < len; i++) {
            var obj = data[i];

            var has_child = obj.hasOwnProperty('childrens');

            var position_x = parent_position_start + pre_obj_width * i + pre_obj_width / 2 - obj.width / 2;
            var position_y = last_image_pos_y + obj.height / 2;
            var zr_obj = new zrender.Image({
                position: [position_x, position_y],
                style: {
                    image: obj.img_src,
                    width: obj.width,
                    height: obj.height
                },
                cursor: "pointer",
                draggable: This.draggable,
                zlevel: 2
            });
            This.zr.add(zr_obj);

            //show text
            var info = obj.data;
            var text = "";
            for (var key in info) {
                text += key + " = " + info[key] + "\n";
            }

            var text_position_x = position_x + obj.width + 10;
            var text_position_y = position_y + 10;
            var text_width = 150;
            if (!has_child) {
                text_position_x = position_x - text_width / 2 + obj.width / 2;
                text_position_y = position_y + obj.height / 2 + 10;
            }

            var zr_text = new zrender.Text({
                position : [text_position_x, text_position_y],
                style: {
                    text: text,
                    width: text_width,
                    textFill: '#5d8578',
                    textFont: '10px Microsoft Yahei',
                    textLineHeight: 18,
                    rich: {
                        a: {
                            textLineHeight: 18
                        }
                    },
                    truncate: {
                        outerWidth: text_width,
                        ellipsis: "..."
                    }
                },
                zlevel: 4,
                draggable: true
            }).on('mouseover', function() {
                this.attr("style", {
                    textFill: '#55a36b',
                    truncate: {
                    }
                });
            }).on('mouseout',function() {
                this.attr("style", {
                    textFill: '#5d8578',
                    truncate: {
                        outerWidth: text_width,
                        ellipsis: "..."
                    }
                });
            }).on('click', function() {
                if (This.show_text !== null) {
                    This.show_text.innerHTML = this.style.text;
                }
            });
            This.zr.add(zr_text);

            if (has_parent) {
                var line = new zrender.Line({
                    shape: {
                        x1: parent.position[0] + parent.style.width / 2,
                        y1: parent.position[1] + parent.style.height / 2,
                        x2: zr_obj.position[0] + zr_obj.style.width / 2,
                        y2: zr_obj.position[1] + zr_obj.style.height / 2
                    },
                    style: {
                        stroke: '#4965b0',
                        lineWidth: 2
                    },
                    zlevel: 1
                });
                This.zr.add(line);
                if (This.animation) {
                    var zr_circle = new zrender.Circle({
                        position: [line.shape.x1, line.shape.y1],
                        shape: {
                            r: 2
                        },
                        style: {
                            fill: '#4965b0',
                            stroke: '#4965b0',
                            lineWidth: 1,
                            shadowBlur: 10,
                            shadowColor: '#4965b0'
                        },
                        zlevel: 3,
                        draggable: true
                    });

                    This.zr.add(zr_circle);
                    This.zr.addHover(zr_circle, {
                            fill: 'yellow',
                            lineWidth: 1,
                            shadowBlur: 50,
                            shadowColor: 'green',
                            stroke: 'green',
                            opacity: 1
                    });
                    This.zr.refresh();
                    (function(line, zr_circle) {
                        zr_circle.animate('', true).when(3000, {
                            position: [line.shape.x2, line.shape.y2]
                        }).start();
                    })(line, zr_circle);
                }

                (function(parent, zr_obj, line) {
                    parent.on('mousemove', function(){
                        line.attr('shape', {
                            x1: parent.position[0] + parent.style.width / 2,
                            y1: parent.position[1] + parent.style.height / 2,
                        });
                    });

                    zr_obj.on('mousemove', function(){
                        line.attr('shape', {
                            x2: zr_obj.position[0] + zr_obj.style.width / 2,
                            y2: zr_obj.position[1] + zr_obj.style.height / 2
                        });
                    });
                })(parent, zr_obj, line);
            }

            if (obj.hasOwnProperty('childrens')) {
                drawtreeUseDichotomy(This, obj.childrens, zr_obj, parent_position_start + pre_obj_width * i, pre_obj_width, level_index + 1, last_image_pos_y + obj.height);
            }
        }
    };
    
    function imageTree(dom, domText, animation, draggable) {
        this.dom = dom;
        this.pre_level_height = 50;
        this.zr = null;
        this.total_layers = [];
        
        this.animation = false;
        if (typeof animation != 'undefined' && animation != null) {
            this.animation = true;
        }
        
        this.draggable = false;
        if (typeof draggable != 'undefined' && draggable != null) {
            this.draggable = true;
        }
        
        this.show_text = null;
        if (typeof domText != 'undefined' && domText != null) {
            this.show_text = domText;
        }
    }
    
    imageTree.prototype = {
        init: function(datas, action) {
            this.zr = zrender.init(this.dom, {renderer: 'svg'});
            this.width = this.zr.getWidth();
            this.height = this.zr.getHeight();
            if (action != "Dichotomy") {
                this.layers = demixing(datas);
            }
            console.log(this.layers);
        },
        reload: function(datas, action) {
            if (this.zr != null) {
                this.zr.clear();
                this.zr = null;
            }
            this.render(datas, action);
        },
        render: function(datas, action) {
            if (typeof action == 'undefined' || action == null) {
                action = "Dichotomy";
            }
            
            if (this.zr == null) {
                this.init(datas.data, action);
            }
            
            var zr_text = new zrender.Text({
                position : [10, 10],
                style: {
                    text: datas.title,
                    textFill: 'black',
                    textFont: '14px Microsoft Yahei'
                },
                zlevel: 4,
                draggable: true
            });
            
            this.zr.add(zr_text);
            
            if (action == "Dichotomy") {
                drawtreeUseDichotomy(this, datas.data);
            } else {
                drawTreeUseMaxLeaf(this);
            }
        }
    };
    window.imageTree = imageTree;
})(zrender);
