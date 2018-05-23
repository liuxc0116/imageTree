/*
 * imageTree
 * https://github.com/liuxc/imageTree
 *
 * Copyright (c) 2018 liuxc
 * Licensed under the zrender license.
 */
// JavaScript Document

(function(zrender){
    function imageTree(dom, domText, animation, draggable) {
        this.dom = dom;
        this.pre_level_height = 50;
        this.zr = null;
        
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
        init: function() {
            this.zr = zrender.init(this.dom, {renderer: 'svg'});
            this.width = this.zr.getWidth();
            this.height = this.zr.getHeight();
        },
        reload: function(data) {
            if (this.zr != null) {
                this.zr.clear();
                this.zr = null;
            }
            this.render(data);
        },
        render: function(data, parent, parent_position_start, parent_width, level_index, last_image_pos_y) {
            //create tree use dichotomy
            var This = this;
            if (this.zr == null) {
                this.init();
            }
            var len = data.length;
            
            if (typeof parent_width == 'undefined' || parent_width == null) {
                parent_width = this.width;
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
                last_image_pos_y += this.pre_level_height;
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
                    draggable: this.draggable,
                    zlevel: 2
                });
                this.zr.add(zr_obj);
                
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
                this.zr.add(zr_text);

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
                    this.zr.add(line);
                    if (this.animation) {
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

                        this.zr.add(zr_circle);
                        this.zr.addHover(zr_circle, {
                                fill: 'yellow',
                                lineWidth: 1,
                                shadowBlur: 50,
                                shadowColor: 'green',
                                stroke: 'green',
                                opacity: 1
                        });
                        this.zr.refresh();
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
                    this.render(obj.childrens, zr_obj, parent_position_start + pre_obj_width * i, pre_obj_width, level_index + 1, last_image_pos_y + obj.height);
                }
            }
        }
    };
    window.imageTree = imageTree;
})(zrender);
