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
        init: function(datas) {
            this.zr = zrender.init(this.dom, {renderer: 'svg'});
            this.width = this.zr.getWidth();
            this.height = this.zr.getHeight();
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
            
            var demixing = function(datas, parent, level) {
                if (typeof layers[level] == 'undefined') {
                    layers[level] = [];
                }
                for (var i = 0; i < datas.length; i++) {
                    var data = datas[i];
                    data.id__ =  id++;
                    var node = new Node(data, parent)
                    if (data.hasOwnProperty('childrens')) {
                        demixing(data.childrens, node, level + 1);
                    } else {
                        node.set_leaf(true);
                        leafs.push({"node": node, "level": level});
                    }
                    put_leaf_node_to_other(level);
                    layers[level].push(node);
                }
            }
            
            demixing(datas, null, 0);
            this.total_layers = layers;
            console.log(layers);
        },
        reload: function(datas) {
            if (this.zr != null) {
                this.zr.clear();
                this.zr = null;
            }
            this.render(datas);
        },
        render: function(datas) {
            //create tree base on max leaf
            if (this.zr == null) {
                console.log(datas.data);
                this.init(datas.data);
            }
            var layers = this.total_layers;
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
            var per_layer_height = (this.height - 100) / (layer_len - 1);
            /*if (per_layer_height > 50) {
                per_layer_height = 100;
            }*/
            var zr_text = new zrender.Text({
                position : [10, 20],
                style: {
                    text: datas.title,
                    textFill: 'black',
                    textFont: '14px Microsoft Yahei'
                },
                zlevel: 4,
                draggable: true
            })
            
            this.zr.add(zr_text);
            
            for (var layer_index = layer_len - 1; layer_index >= 0; layer_index--) {
                var This = this;
                var nodes = layers[layer_index];
                var node_len = nodes.length;
                var per_node_width = this.width / (node_len + 1);
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
                        draggable: this.draggable,
                        zlevel: 2
                    });
                    
                    this.zr.add(zr_circle);
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
                    this.zr.add(zr_text);
                    
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
                            this.zr.add(line);
                        }
                    }
                }
            }
        }
    };
    window.imageTree = imageTree;
})(zrender);
