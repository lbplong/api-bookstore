const express = require('express');
const BooksRouter = express.Router();
const sqlite = require('sqlite3');
const fs = require('fs');
const database = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

BooksRouter.get('/all-books', (req, res, next) => {
    const offset = (parseInt(req.headers.page) - 1) * 9;
    database.all(`select * from Books where deleted = 0 ORDER by id DESC LIMIT 9 OFFSET ${offset}`, (error, items) => {
        if (error) {
            next(error);
        } else if (items) {
            res.status(200).json({ books: items });
            next();
        } else {
            res.sendStatus(404);
        }
    })
})
BooksRouter.get('/book/:id', (req, res, next) => {
    const bookId = req.headers.bookid;
    database.get(`select * from Books where deleted = 0 and id =${req.params.id}`, (error, book) => {
        if (error) {
            next(error);
        } else if (book) {
            res.status(200).json({ book: book });
            next();
        } else {
            res.sendStatus(404);
        }
    })
})
BooksRouter.get('/count-book', (req, res, next) => {
    database.get(`select COUNT(*) as amount from Books where deleted= 0`, (error, amount) => {
        if (error) {
            next(error);
        } else if (amount) {
            res.status(200).json({ amount: amount });
            next();
        } else {
            res.sendStatus(404);
            next();
        }
    })
})

BooksRouter.get('/trash-books', (req, res, next) => {
    const offset = (parseInt(req.headers.page) - 1) * 9;
    database.all(`select * from Books where deleted = 1 ORDER by deleted_at DESC LIMIT 9 OFFSET ${offset}`, (error, items) => {
        if (error) {
            next(error);
        } else if (items) {
            res.status(200).json({ books: items });
            next();
        } else {
            res.sendStatus(404);
        }
    })
})
BooksRouter.get('/count-trash', (req, res, next) => {
    database.get(`select COUNT(*) as amount from Books where deleted= 1`, (error, amount) => {
        if (error) {
            next(error);
        } else if (amount) {
            res.status(200).json({ amount: amount });
            next();
        } else {
            res.sendStatus(404);
            next();
        }
    })
})

BooksRouter.put('/delete-book', (req, res, next) => {
    const dataUpdate = req.body.dataupdate;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password = '${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var d = new Date();
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`update Books set deleted = 1, deleted_by = ${account.id}, deleted_at = '${receiveAt}' where id = ${dataUpdate.bookid}`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select * from Books where id = ${dataUpdate.bookid}`, (error, book) => {
                            if (error) {
                                next(error);
                            } else if (book) {
                                res.status(200).json({ message: 'success' });
                            } else {
                                res.status(200).json({ message: 'failed' });
                            }
                        })
                    }
                })
            } else {
                res.sendStatus(404);
            }
        })
    }
})
BooksRouter.delete('/del-book', (req, res, next) => {
    const bookId = req.headers.bookid;
    const user = req.headers.username;
    const pass = req.headers.password;
    if (!bookId || !user || !pass) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${user}' and password = '${pass}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                database.all(`select name from BookImages where book_id = ${bookId}`, (error, images) => {
                    if (error) {
                        next(error);
                    } else if (images) {
                        for (let i = 0; i < images.length; i++) {
                            fs.unlink(`./src/image/product/${images[i].name}`, (err) => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            })
                        }
                        database.run(`delete from Books where id = ${bookId}`, (error) => {
                            if (error) {
                                next(error);
                            } else {
                                database.run(`delete from Compose where book_id = ${bookId}`, (error) => {
                                    if (error) {
                                        next(error)
                                    }
                                    else {
                                        database.run(`delete from ConnectLang where book_id = ${bookId}`, (error) => {
                                            if (error) {
                                                next(error);
                                            } else {
                                                res.status(200).json({ message: 'success' });
                                            }
                                        })

                                    }
                                })

                            }
                        })
                    } else {
                        res.sendStatus(404);
                    }
                })

            } else {
                res.sendStatus(404);
            }
        })
    }
})
BooksRouter.put('/convert-book', (req, res, next) => {
    const dataUpdate = req.body.dataupdate;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password = '${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {

                database.run(`update Books set deleted = 0, deleted_by = NULL, deleted_at = NULL where id = ${dataUpdate.bookid}`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select * from Books where id = ${dataUpdate.bookid}`, (error, book) => {
                            if (error) {
                                next(error);
                            } else if (book) {
                                res.status(200).json({ message: 'success' });
                            } else {
                                res.status(200).json({ message: 'failed' });
                            }
                        })
                    }
                })
            } else {
                res.sendStatus(404);
            }
        })
    }
})
BooksRouter.put('/update-book', (req, res, next) => {
    const dataUpdate = req.body.bookupdate;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username = '${dataUpdate.username}' and password = '${dataUpdate.password}' and deleted=0 and type = 1`, (error, account) => {
            if (error) { next(error) } else if (account) {
                var d = new Date();
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`update Books set 
                    name = '${dataUpdate.name}',
                    price = ${dataUpdate.price},
                    sale = ${dataUpdate.sale},
                    description = '${dataUpdate.description}',
                    publisher_id = ${dataUpdate.publisher},
                    update_by = ${account.id},
                    update_at = '${receiveAt}' where id = ${dataUpdate.id} and deleted = 0`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select * from Books where id = ${dataUpdate.id} and deleted=0`, (error, book) => {
                            if (error) {
                                next(error);
                            } else if (book) {
                                res.status(200).json({ message: 'success' });
                            } else {
                                res.status(200).json({ message: 'failed' });
                            }
                        })
                    }
                })
            }
        })
    }
})
BooksRouter.post('/add-book', (req, res, next) => {
    const data = req.body.upload;
    if (!data) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username = '${data.username}' and password = '${data.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var d = new Date();
                const routine = removeNameToRoutine(data.name) + `-${d.getTime()}`;
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`insert into Books (
                    name, 
                    routine,  
                    description, 
                    publisher_id,
                    price, 
                    sale,
                    create_by,
                    create_at,
                    deleted
                    ) values (
                        '${data.name}',
                        '${routine}',
                        '${data.description}',
                        ${data.publisher},
                        ${data.price},
                        ${data.sale},
                        ${account.id},
                        '${receiveAt}',
                        0
                    )`, function (error) {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select id from Books where id = ${this.lastID}`, (error, book) => {
                            if (error) {
                                next(error);
                            } else if (book) {
                                var composeSql = `insert into Compose (artist_id, book_id) values `;
                                for (let i = 0; i < data.compose.length; i++) {
                                    if (i === data.compose.length - 1) {
                                        composeSql += `(${data.compose[i].id}, ${book.id});`;
                                    } else {
                                        composeSql += `(${data.compose[i].id}, ${book.id}),`;
                                    }
                                }
                                database.run(composeSql, (error) => {
                                    if (error) {
                                        next(error);
                                    } else {
                                        var connectSql = `insert into ConnectLang (language_id, book_id) values `;
                                        for (let i = 0; i < data.connect.length; i++) {
                                            if (i === data.connect.length - 1) {
                                                connectSql += `(${data.connect[i].id}, ${book.id});`;
                                            } else {
                                                connectSql += `(${data.connect[i].id}, ${book.id}),`;
                                            }
                                        }
                                        database.run(connectSql, (error) => {
                                            if (error) {
                                                next(error);
                                            } else {
                                                res.status(200).json({ book: book })
                                            }
                                        })

                                    }
                                })
                            } else {
                                res.sendStatus(404);
                            }
                        })
                    }
                })
            } else {
                res.sendStatus(404);
            }
        })
    }
})
function removeNameToRoutine(str) {
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "a");
    str = str.replace(/??|??|???|???|???|??|???|???|???|???|???/g, "e");
    str = str.replace(/??|??|???|???|??/g, "i");
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "o");
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???/g, "u");
    str = str.replace(/???|??|???|???|???/g, "y");
    str = str.replace(/??/g, "d");
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "a");
    str = str.replace(/??|??|???|???|???|??|???|???|???|???|???/g, "e");
    str = str.replace(/??|??|???|???|??/g, "i");
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???|??|???|???|???|???|???/g, "o");
    str = str.replace(/??|??|???|???|??|??|???|???|???|???|???/g, "u");
    str = str.replace(/???|??|???|???|???/g, "y");
    str = str.replace(/??/g, "d");
    // Some system encode vietnamese combining accent as individual utf-8 characters
    // M???t v??i b??? encode coi c??c d???u m??, d???u ch??? nh?? m???t k?? t??? ri??ng bi???t n??n th??m hai d??ng n??y
    str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // ?? ?? ?? ?? ??  huy???n, s???c, ng??, h???i, n???ng
    str = str.replace(/\u02C6|\u0306|\u031B/g, ""); // ?? ?? ??  ??, ??, ??, ??, ??
    // Remove extra spaces
    // B??? c??c kho???ng tr???ng li???n nhau
    str = str.replace(/ + /g, " ");
    str = str.trim();
    // Remove punctuations
    // B??? d???u c??u, k?? t??? ?????c bi???t
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, " ");
    str = str.replace(/ /g, '-');
    return str;
}
module.exports = BooksRouter;