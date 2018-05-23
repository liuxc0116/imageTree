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
            this.is_leaf = data;
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
                    if (data.hasOwnProperty('children')) {
                        demixing(data.children, node, level + 1);
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
        reload: function(data) {
            if (this.zr != null) {
                this.zr.clear();
                this.zr = null;
            }
            this.render(data);
        },
        render: function(datas) {
            if (this.zr == null) {
                this.init(datas);
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
                console.log("nodes[start].pos_x, nodes[end].pos_x = " + nodes[start].pos_x + ", " + nodes[end].pos_x + "  " + (nodes[start].pos_x + nodes[end].pos_x) / 2.0);
                return (nodes[start].pos_x + nodes[end].pos_x) / 2.0;
            }
            
            var layer_len = layers.length;
            var per_level_height = this.height / (layer_len + 1);
            
            for (var layer_index = layer_len - 1; layer_index >= 0; layer_index--) {
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

                    console.log("pos_x=" + pos_x);
                    var zr_circle = new zrender.Circle({
                            position: [pos_x, per_level_height * layer_index + 20],
                            shape: {
                                r: 10
                            },
                            style: {
                                fill: '#4965b0',
                                lineWidth: 1,
                            },
                            zlevel: 3
                    });
                    this.zr.add(zr_circle);
                    node.set_zrender_obj(zr_circle);
                    if (node.leaf == false) {
                        for (var i = 0; i < child_nodes.length; i++) {
                            var node = child_nodes[i];
                            var line = new zrender.Line({
                                shape: {
                                    x1: zr_circle.position[0],
                                    y1: zr_circle.position[1],
                                    x2: node.zr_obj.position[0],
                                    y2: node.zr_obj.position[1]
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
