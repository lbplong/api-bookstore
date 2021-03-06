const ArtistsRouter = require('express').Router();
const sqlite = require('sqlite3');
const database = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

ArtistsRouter.get('/artists', (req, res, next) => {
    const bookId = req.headers.bookid;
    if (!bookId) {
        return res.sendStatus(400);
    } else {
        database.all(`select Artists.* from Artists inner join Compose on Artists.id = Compose.artist_id
    where Compose.book_id = ${bookId} and Artists.deleted=0`, (error, artists) => {
            if (error) {
                next(error);
            } else if (artists) {
                res.status(200).json({ artists: artists });
            } else {
                res.sendStatus(404);
            }
        })
    }
})
ArtistsRouter.get('/all-artists', (req, res, next) => {
    const page = req.headers.page;
    let sqlString = `select * from Artists where deleted = 0`;
    if (page) {
        const offset = (parseInt(page) - 1) * 9;
        sqlString += ` ORDER by id DESC LIMIT 9 OFFSET ${offset}`;
    }
    database.all(sqlString, (error, artists) => {
        if (error) {
            next(error);
        } else if (artists) {
            res.status(200).json({ artists: artists });
        } else {
            res.sendStatus(404);
        }
    })
})
ArtistsRouter.get('/trash-artist', (req, res, next) => {
    const page = req.headers.page;
    let sqlString = `select * from Artists where deleted = 1`;
    if (page) {
        const offset = (parseInt(page) - 1) * 9;
        sqlString += ` ORDER by id DESC LIMIT 9 OFFSET ${offset}`;
    }
    database.all(sqlString, (error, artists) => {
        if (error) {
            next(error);
        } else if (artists) {
            res.status(200).json({ artists: artists });
        } else {
            res.sendStatus(404);
        }
    })
})
ArtistsRouter.get('/count-trash', (req, res, next) => {
    database.get(`select COUNT(*) as amount from Artists where deleted= 1`, (error, amount) => {
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
ArtistsRouter.get('/count-artist', (req, res, next) => {
    database.get(`select COUNT(*) as amount from Artists where deleted= 0`, (error, amount) => {
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
ArtistsRouter.put('/delete-artist', (req, res, next) => {
    const dataUpdate = req.body.dataupdate;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password = '${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                database.all(`select * from Compose where artist_id = ${dataUpdate.artistid}`, (error, compose) => {
                    if (error) {
                        next(error);
                    } else if (compose.length) {
                        res.status(200).json({ message: 'error' });
                    } else {
                        var d = new Date();
                        const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                        database.run(`update Artists set deleted = 1, deleted_by = ${account.id}, deleted_at = '${receiveAt}' where id = ${dataUpdate.artistid}`, (error) => {
                            if (error) {
                                next(error);
                            } else {
                                database.get(`select * from Artists where id = ${dataUpdate.artistid}`, (error, artist) => {
                                    if (error) {
                                        next(error);
                                    } else if (artist) {
                                        res.status(200).json({ message: 'success' });
                                    } else {
                                        res.status(200).json({ message: 'failed' });
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
    }
})
ArtistsRouter.put('/convert-artist', (req, res, next) => {
    const dataUpdate = req.body.dataupdate;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password = '${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {

                database.run(`update Artists set deleted = 0, deleted_by = NULL, deleted_at = NULL where id = ${dataUpdate.artistid}`, (error) => {
                    if (error) {
                        next(error);
                    } else {
                        database.get(`select * from Artists where id = ${dataUpdate.artistid}`, (error, book) => {
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
ArtistsRouter.delete('/del-artist', (req, res, next) => {
    const artistId = req.headers.artistid;
    const user = req.headers.username;
    const pass = req.headers.password;
    if (!artistId || !user || !pass) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${user}' and password = '${pass}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                database.all(`select * from Compose where artist_id = ${artistId}`, (error, compose) => {
                    if (error) {
                        next(error);
                    } else if (compose) {
                        res.status(200).json({ message: 'failed' });
                    } else {
                        database.run(`delete from Artists where id = ${artistId}`, (error) => {
                            if (error) {
                                next(error);
                            } else {
                                res.status(200).json({ message: 'success' });
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
ArtistsRouter.get('/artist', (req, res, next) => {
    const artistId = req.headers.artist;
    if (!artistId) {
        return res.sendStatus(400);
    } else {
        database.get(`select * from Artists where id = ${artistId} and deleted=0`, (error, artist) => {
            if (error) {
                next(error);
            } else if (artist) {
                res.status(200).json({ artist: artist });
            } else {
                res.sendStatus(404);
            }
        })
    }
})
ArtistsRouter.put('/update-artist', (req, res, next) => {
    const dataUpdate = req.body.data;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password ='${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var d = new Date();
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`update Artists set name = '${dataUpdate.name}', update_by = ${account.id}, update_at='${receiveAt}' where id = ${dataUpdate.artist}`, (error) => {
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
ArtistsRouter.post('/add-artist', (req, res, next) => {
    const dataUpdate = req.body.data;
    if (!dataUpdate) {
        return res.sendStatus(400);
    } else {
        database.get(`select id from Accounts where username ='${dataUpdate.username}' and password ='${dataUpdate.password}' and type = 1`, (error, account) => {
            if (error) {
                next(error);
            } else if (account) {
                var d = new Date();
                const routine = removeNameToRoutine(dataUpdate.name) + `-${d.getTime()}`;
                const receiveAt = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + ((d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1)) + '-' + d.getFullYear();
                database.run(`insert into Artists (
                    name,
                    routine,
                    create_by,
                    create_at
                    ) values (
                        '${dataUpdate.name}',
                        '${routine}',
                        ${account.id},
                        '${receiveAt}'
                    )`, (error) => {
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
module.exports = ArtistsRouter;