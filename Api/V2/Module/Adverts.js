const AdvertsRouter = require('express').Router();
const sqlite = require('sqlite3');
const database = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');
const fs = require('fs');

AdvertsRouter.get('/all/:delete', (req, res, next) => {
    const page = req.headers.page;
    let sqlString = `select * from Adverts where deleted = ${req.params.delete}`;
    if (page) {
        const offset = (parseInt(page) - 1) * 9;
        sqlString += ` ORDER by id DESC LIMIT 9 OFFSET ${offset}`;
    }
    database.all(sqlString, (error, adverts) => {
        if (error) {
            next(error);
        } else if (adverts) {
            res.status(200).json({ adverts: adverts });
        } else {
            res.sendStatus(404);
        }
    })
})
AdvertsRouter.get('/advert/:id', (req, res, next) => {
    database.get(`select * from Adverts where id = ${req.params.id} and deleted = 0`, (error, advert) => {
        if (error) {
            next(error);
        } else if (advert) {
            res.status(200).json({ advert: advert });
        } else {
            res.sendStatus(404);
        }
    })
})
AdvertsRouter.get('/count/:delete', (req, res, next) => {
    database.get(`select COUNT(*) as amount from Adverts where deleted= ${req.params.delete}`, (error, amount) => {
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
AdvertsRouter.put(`/delete/:id`, (req, res, next) => {
    const user = req.body.user;
    database.get(`select id from Accounts where username = '${user.username}' and password = '${user.password}' and type = 1`, (error, account) => {
        if (error) {
            next(error);
        } else if (account) {
            var d = new Date();
            const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
            database.run(`update Adverts set deleted = 1, deleted_by = ${account.id}, deleted_at= '${receiveAt}' where id = ${req.params.id}`, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({ message: 'success' });
                }
            })
        } else {
            res.sendStatus(404);
        }
    })
})
AdvertsRouter.put(`/convert/:id`, (req, res, next) => {
    const user = req.body.user;
    database.get(`select id from Accounts where username = '${user.username}' and password = '${user.password}' and type = 1`, (error, account) => {
        if (error) {
            next(error);
        } else if (account) {
            var d = new Date();
            const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
            database.run(`update Adverts set deleted = 0, deleted_by = NULL, deleted_at= NULL where id = ${req.params.id}`, (error) => {
                if (error) {
                    next(error);
                } else {
                    res.status(200).json({ message: 'success' });
                }
            })
        } else {
            res.sendStatus(404);
        }
    })
})
AdvertsRouter.post('/add', (req, res, next) => {
    const advert = req.body.data;
    if (!advert) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username = '${advert.username}' and password = '${advert.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var d = new Date();
                var short = advert.description.substr(0, 100);
                const routine = removeNameToRoutine(advert.name) + `-${d.getTime()}`;
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`insert into Adverts (
               name,
               description,
               short_description,
               begin,
               finish,
               path,
               create_by,
               create_at
           ) values (
               '${advert.name}',
               '${advert.description}',
               '${short}',
                '${advert.begin}',
                '${advert.finish}',
                '${routine}',
                ${account.id},
                '${receiveAt}'
           )`, function (error) {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select * from Adverts where id = ${this.lastID}`, (error, advert) => {
                            if (error) {
                                next(error);
                            } else if (advert) {
                                res.status(202).json({ advert: advert })
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
AdvertsRouter.put('/update/:id', (req, res, next) => {
    const advert = req.body.data;
    if (!advert) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username='${advert.username}' and password='${advert.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var short = advert.description.substr(0, 100);
                var d = new Date();
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`update Adverts set
                    name = '${advert.name}',
                    description = '${advert.description}',
                    short_description = '${short},
                    begin = '${advert.begin}',
                    finish = '${advert.finish}',
                    create_by = ${account.id},
                    create_at = '${receiveAt}'`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        res.status(200).json({ message: 'success' });
                    }
                })
            } else {
                res.sendStatus(404);
            }
        })
    }
})
AdvertsRouter.delete('/del/:id', (req, res, next) => {
    const user = req.body.user;
    if (!user) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username = '${user.username}' and password = '${user.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                database.run(`delete from Adverts where id = ${req.params.id} and deleted = 1`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        database.all(`select name from AdvertImages where advert_id = ${req.params.id}`, (error, images) => {
                            if (error) {
                                next(error);
                            } else if (images) {
                                for (let i = 0; i < images.length; i++) {
                                    fs.unlink(`./src/image/advert/${images[i].name}`, (err) => {
                                        if (err) {
                                            console.error(err);
                                            return;
                                        }
                                    })
                                }
                                database.run(`delete from AdvertImages where advert_id = ${req.params.id}`, (error) => {
                                    if (error) {
                                        next(error);
                                    } else {
                                        database.run(`delete from BooksAdvert where advert_id=${req.params.id}`, (error) => {
                                            if (error) {
                                                next(error);
                                            } else {
                                                res.status(200).json({ message: 'success' })
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
            } else { res.sendStatus(404) }
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
module.exports = AdvertsRouter;