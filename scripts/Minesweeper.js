let Landmine = (function() {
    function Landmine(bomb) {
        this.hasBomb = bomb;        //boolean 该雷区是否有炸弹
        this.flag = false;          //boolean 该雷区是否插了旗子
        this.qestionMark  = false;  //boolean 该雷区是否标了问号
        this.beenOverturn = false;  //boolean 该雷区是否被翻开
        this.number = 0;            //number  该雷区周围雷区的炸弹数
    }
    Landmine.prototype.addBomb = function() {
        this.hasBomb = true;
    }
    Landmine.prototype.setFlag = function() {
        this.clearMark();
        this.flag = true;
    };
    Landmine.prototype.setQestionMark = function() {
        this.clearMark();
        this.qestionMark = true;
    };
    Landmine.prototype.clearMark = function() {
        this.qestionMark = false;
        this.flag = false;
    };
    Landmine.prototype.overturn = function() {
        //if(this.overturn) return;
        this.beenOverturn = true;
    };
    Landmine.prototype.setNumber = function(n) {
        this.number = n;
    };
    Landmine.prototype.getMarkType = function() {
        if(this.flag)
            return 2;
        else if(this.qestionMark)
            return 3;
        else 
            return 0;
    };

    return Landmine;
}());

let C = (function() {
    function C(x, y) {
        this.x = x; this.y = y;
    }
    return C;
}());

let Minesweeper = (function() {
    function Minesweeper(canvasID) {
        this.minefields;    //缓存获取到的canvas标签
        this.ct;            //缓存获取到的context对象

        this.readied = false;   //游戏准备完成状态
        this.gameStart = false; //游戏开始状态
        this.over = false;

        this.matrix;    //Landmine[][] 储存地雷状态的二位数组
        this.x = 9;     //地雷矩阵的大小
        this.y = 9;
        this.amount = 10;

        this.lastMines = 0;

        this.init(canvasID);

        let that = this;

        //屏蔽右键菜单
        this.minefields.addEventListener('contextmenu', function(e) {
            //console.log(e.type);
            e.preventDefault();

        });

        //绑定鼠标点击事件
        this.minefields.addEventListener('mousedown', function(e) {
            if(that.over || !that.readied) return;
            //console.log(e.type);
            let curX = Math.floor(e.offsetX / that.blockSize),
                curY = Math.floor(e.offsetY / that.blockSize);
            //console.log(e.button);
            let tempLandmine = that.matrix[curY][curX];

            //按下鼠标主键
            if(e.button === 0 && tempLandmine.getMarkType() === 0) {
                if(!that.gameStart) {
                    that.createLandmines(curX, curY);
                    that.gameStart = true;
                }
                //that.tester();
                //if(!that.matrix[curY][curX].beenOverturn)
                    that.clickOn(curX, curY);
            //按下鼠标次键
            } else if(e.button === 2 && !tempLandmine.beenOverturn) {
                that.make(curX, curY);
                that.drawBlock(curX, curY, 0);
                let n = tempLandmine.getMarkType();
                if(n !== 0)
                    that.drawBlock(curX, curY, n);
            }
        });

        this.minefields.addEventListener('ondblclick', function(e) {
            console.log(e);
        })

        //绑定鼠标移动事件， 用于给方块绘制高亮
        let tmpX = 3, tmpY = 3;
        this.minefields.addEventListener('mousemove', function(e) {
            if(that.over || !that.readied) return;
            tmpX = tmpX >= that.x ? that.x - 1 : tmpX;
            tmpY = tmpY >= that.y ? that.y - 1 : tmpY;
            //将鼠标相对被监听元素的坐标，转换为地雷的矩阵坐标
            let curX = Math.floor(e.offsetX / that.blockSize),
                curY = Math.floor(e.offsetY / that.blockSize);
            //如果该次mousemove事件 触发的坐标与上一次不同
            if(curX !== tmpX || curY !== tmpY) {
                //判断触发的坐标是否合法
                if(curX >= that.x || curY >= that.y || curX < 0 || curY < 0)
                    return;
                //如果这次的焦点方块是被翻开过或被标记 跳出，不进行高亮绘制
                let curLandmine = that.matrix[curY][curX];
                let tmpLandmine = that.matrix[tmpY][tmpX];

                //清除上一次绘制的高亮
                if(!tmpLandmine.beenOverturn && tmpLandmine.getMarkType() === 0) {
                    that.drawBlock(tmpX, tmpY, 0);
                } 
                if(tmpLandmine.beenOverturn) {
                    that.drawBlock(tmpX, tmpY, 1);
                    if(tmpLandmine.number !==0) {
                        that.drawNumber(tmpX, tmpY, tmpLandmine.number);
                    } else if(tmpLandmine.hasBomb){
                        that.drawBlock(tmpX, tmpY, 4);
                    } else
                        ;
                } else {
                    that.drawBlock(tmpX, tmpY, 0);
                    let n = tmpLandmine.getMarkType();
                    that.drawBlock(tmpX, tmpY, n);
                }

                //绘制高亮，并缓存绘制的坐标
                that.ct.fillStyle = 'rgba(255, 255, 255, 0.3)';
                that.ct.fillRect(curX * that.blockSize, curY * that.blockSize, that.blockSize, that.blockSize);
                tmpX = curX;
                tmpY = curY;
            }
        }, false);
    }
    //雷区的绘制大小
    Minesweeper.prototype.blockSize = 24;
    //image[] 全类共享的图片资源
    Minesweeper.prototype.imagesOfGame = (function() {
        let imgObj = new Array();
        for(let i = 0; i < 5; i++)
            imgObj[i] = new Image();

        imgObj[0].src = 'images/unknown.jpg';
        imgObj[1].src = 'images/known.jpg';
        imgObj[2].src = 'images/flag.png';
        imgObj[3].src = 'images/qmark.png';
        imgObj[4].src = 'images/landmine.png';
        return imgObj;
    }());
    //string[] 不同数字对应的颜色值
    /*颜色值:
     * 1 #414fbc
     * 2 #1d6903
     * 3 #a80708
     * 4 #010181
     * 5 #1d6903
     * 6 #870001
     * 7 #010181
     * 8 #870001
    **/
    Minesweeper.prototype.numberColor = ['#000', '#414fbc', '#1d6903', '#a80708', '#010181', '#1d6903', '#870001', '#010181', '#870001'];

    //初始化函数
    Minesweeper.prototype.init = function(canvasID) {
        this.minefields = document.getElementById(canvasID);
        this.ct = this.minefields.getContext('2d');
    };
    Minesweeper.prototype.ready = function() {
        this.matrix = new Array();
        for(let i = 0; i < this.y; i++) {
            this.matrix[i] = new Array();
            for(let j = 0; j < this.x; j++) {
                this.matrix[i][j] = new Landmine(false);
            }
        }
        this.drawMinefields();
        this.readied = true;
        this.gameStart = false;
        this.over = false;
    };
    //随机生成地雷, 参数为不生成地雷的坐标
    Minesweeper.prototype.createLandmines = function(x, y) {
        if(!this.readied) return;
        let count = 0;
        let r = 0;
        //随机布置地雷
        while(count < this.amount) {
            let curX = this.randomX(),
                curY = this.randomY();

            //判断地雷是否生成在参数位置，是就跳过此次循环
            if(curX === x && curY === y)
                continue;
            //判断当前位置是否有地雷，是就跳过
            if(this.matrix[curY][curX].hasBomb)
                continue;
            //降低初次点击的方块附近生成地雷的几率
            if(Math.abs(x-curX) <= 1 && Math.abs(y-curY) <= 1) {
                if(Math.random() < 0.9) {
                    continue;
                }
            }
            if(Math.abs(x-curX) <= 2 && Math.abs(y-curY) <= 2) {
                if(Math.random() < r) {
                    r += 0.12;
                    continue;
                }
            }

            this.matrix[curY][curX].addBomb();
            count++;
        }
        this.lastMines = count;
        //计算每个区块四周地雷的数量
        for(let i = 0; i < this.y; i++) {
            for(let j = 0; j < this.x; j++) {
                let count = 0;
                //正上方的三个方块
                if(i > 0) {
                    if(j > 0) {
                        if(this.matrix[i-1][j-1].hasBomb)
                            ++count;
                    }
                    if(this.matrix[i-1][j].hasBomb)
                        ++count;
                    if(j < this.x - 1) {
                        if(this.matrix[i-1][j+1].hasBomb)
                            ++count;
                    }
                }
                //左侧的一个方块
                if(j > 0) {
                    if(this.matrix[i][j-1].hasBomb)
                        ++count;
                }

                //右侧的一个方块
                if(j < this.x - 1) {
                    if(this.matrix[i][j+1].hasBomb)
                        ++count;
                }
                
                //正下方的三个方块
                if(i < this.y - 1) {
                    if(j > 0) {
                        if(this.matrix[i+1][j-1].hasBomb)
                            ++count;
                    }
                    if(this.matrix[i+1][j].hasBomb)
                        ++count;
                    if(j < this.x - 1) {
                        if(this.matrix[i+1][j+1].hasBomb)
                            ++count;
                    }
                }
                this.matrix[i][j].setNumber(count);
            }
        }
    };
    //游戏逻辑实现函数
    //转换坐标区块的标记状态 ，!!这个函数不会更新画面，需自己写绘制代码,
    //还特别需要注意高亮绘制的部分代码
    Minesweeper.prototype.make = function(x, y) {
        if(this.matrix[y][x].beenOverturn)
            return;
        if(this.matrix[y][x].flag) {
            this.matrix[y][x].setQestionMark();
        } else if(this.matrix[y][x].qestionMark) {
            this.matrix[y][x].clearMark();
            ++this.lastMines;
        } else if(!this.matrix[y][x].qestionMark && !this.matrix[y][x].flag) {
            this.matrix[y][x].setFlag();
            --this.lastMines;
        } else
            ;
    };

    //死亡
    Minesweeper.prototype.died = function() {
        for(let i = 0; i < this.y; i++) {
            for(let j = 0; j < this.x; j++) {
                if(this.matrix[i][j].hasBomb) {
                    this.drawBlock(j, i, 1);
                    this.drawBlock(j, i, 4);
                }
            }
        }
        let fs = (this.x*this.blockSize)/3;
        this.ct.font = 'bold ' + fs + 'px Arial';
        this.ct.textAling = 'center';
        this.ct.textBaseline = 'top';
        this.ct.fillStyle = 'red';
        this.ct.fillText('DIE', 0, 0);
    }
    //点击
    Minesweeper.prototype.clickOn = function(x, y) {
        if(x < 0 || y < 0 || x > this.x - 1 || y > this.y - 1)
            return;
        let landmine = this.matrix[y][x];
        if(landmine.beenOverturn) {
            this.quickClick(x, y);
            return;
        }

        if(landmine.flag || landmine.qestionMark)
            return;

        landmine.overturn();

        if(landmine.hasBomb) {
            this.died();
            this.over = true;
            return;
        }

        if(landmine.number !== 0) {
            this.drawBlock(x, y, 1);
            this.drawNumber(x, y, landmine.number);
        } else {
            this.drawBlock(x, y, 1);
            this.sweep(x, y);
        }
    };

    Minesweeper.prototype.sweep = function(x, y) {
        let queue = new Array();
        queue.push(new C(x, y));
        let M = this.matrix;

        while(queue.length !== 0) {
            let tmpC = queue.shift();
            let x = tmpC.x;
            let y = tmpC.y;
            this.clickOn(x, y);

            if(M[y][x].number === 0) {
                let rb = this.getRoundBlock(x, y);
                //
                rb.map((val, index) => {
                    let x = val.x, y = val.y;
                    if(!M[y][x].beenOverturn) {
                        queue.push(val);
                    }
                });
            }
        }
    };
    Minesweeper.prototype.quickClick = function(x, y) {
        let M = this.matrix;
        let number = M[y][x].number;
        let rc = this.getRoundBlock(x, y);
        let count = 0;

        rc.map((v) => {
            let x = v.x, y = v.y;
            if(M[y][x].flag) {
                ++count;
            }
        });

        if(count !== number) return;
        //console.log(rc);
        rc.map((v) => {
            let cx = v.x, cy = v.y;
            //console.log(M[y][x].beenOverturn + '\n');
            if(!M[cy][cx].beenOverturn) {
                this.clickOn(cx, cy);
            }
        });
    }

    //绘制函数
    Minesweeper.prototype.drawMinefields = function() {
        this.minefields.width = this.x * this.blockSize;
        this.minefields.height = this.y * this.blockSize;
        this.minefields.style.width  = this.x * this.blockSize + 'px';
        this.minefields.style.height = this.y * this.blockSize + 'px';

        for(let i = 0; i < this.y; i++) {
            for(let j = 0; j < this.x; j++) {
                this.drawBlock(j, i, 0);
            }
        }
    };
    /*绘制方块函数，前两个参数为绘制的坐标，对应矩阵的下标
     *第三个参数为方块类型，0为未翻开的方块，1为翻开的方块，2为旗子，3为问号，4为地雷
    **/
    Minesweeper.prototype.drawBlock = function(x, y, type) {
        let size = this.blockSize;
        this.ct.drawImage(this.imagesOfGame[type], x*size, y*size, size, size);
    };
    /*绘制数字
     *颜色值:
     * 1 #414fbc
     * 2 #1d6903
     * 3 #a80708
     * 4 #010181
     * 5 #1d6903
     * 6 #870001
     * 7 #010181
     * 8 #870001
    **/
    Minesweeper.prototype.drawNumber = function(x, y, num) {
        let size = this.blockSize;
        this.ct.font = 'bold ' + this.blockSize + 'px Arial';
        this.ct.textAling = 'center';
        this.ct.textBaseline = 'top';
        this.ct.fillStyle = this.numberColor[num];
        this.ct.fillText(num, x*size + size*0.2, y*size + size*0.06);
    };

    /*控制类函数 */
    //设在宽高和雷的数量
    Minesweeper.prototype.setWHA = function(m, n, a) {
        this.x = m;
        this.y = n;
        this.amount = a;
    };

    /*辅助函数 */
    Minesweeper.prototype.randomX = function() {
        return Math.floor(Math.random()*this.x);
    };
    Minesweeper.prototype.randomY = function() {
        return Math.floor(Math.random()*this.y);
    };
    Minesweeper.prototype.tester = function(bool) {
        for(let i = 0; i < this.y; i++) {
            for(let j = 0; j < this.x; j++) {
                this.matrix[i][j].overturn();
                this.drawBlock(j, i, 1);

                if(this.matrix[i][j].hasBomb)
                    this.drawBlock(j, i, 4);
                else if(this.matrix[i][j].number !== 0)
                    this.drawNumber(j, i, this.matrix[i][j].number);
                else
                    continue;
            }
        }
    };
    Minesweeper.prototype.getRoundBlock = function(x, y) {
        let que = new Array();
        que.push(new C(x - 1, y - 1));
        que.push(new C(x,     y - 1));
        que.push(new C(x + 1, y - 1));

        que.push(new C(x - 1, y));
        que.push(new C(x + 1, y));

        que.push(new C(x + 1, y + 1));
        que.push(new C(x,     y + 1));
        que.push(new C(x - 1, y + 1));


        for(let i = 0; i < que.length; ) {
            let y = que[i].y, x = que[i].x;
            if(y < 0 || y >= this.y || x < 0 || x >= this.x) {
                que.splice(i, 1);
            } else ++i;
        }
        return que;
    }

    return Minesweeper;
}());






