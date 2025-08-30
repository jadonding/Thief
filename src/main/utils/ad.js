'use strict';
import axios from 'axios';

const url = 'http://ad.c.team/ad?p=thief-book';

export default {
    getAd(callback) {
        axios.get(url)
            .then(function(response) {
                callback(response.data)
            })
            .catch(function(err) {
                callback("err")
            });
    }
};