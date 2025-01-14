const PORT = 8000;
const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');
const fs = require('fs');

const app = express();
const url = 'https://www.lakeareatech.edu/academics/faculty-and-staff-information/';

async function downloadImage(url, filepath) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    return new Promise((resolve,reject) => {
        response.data.pipe(fs.createWriteStream(filepath))
            .on('error', reject)
            .once('close', () => resolve(filepath));
    });
}

function convertToCSV(arr) {
    let keys = Object.keys(Object.assign({},...arr));

    var result = keys.join(',') + '\n';

    arr.forEach(function (obj) {
        result += keys.map((k) => {
            let item = "";
            if (obj[k]) item = obj[k];
            return item
        }).join(',') + '\n';
    });
    return result;
}

function saveToFile(csv, filename) {
    fs.writeFile(filename, csv, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
    });
}

axios(url).then(response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const employees = [];

        $('.togglePanel', html).each(function(i, elem) {

            let thisParentId = i;
            
            $(this).find('.staff_card', html).each(function() {
                const id = employees.length + 1;
                const parent = thisParentId;
                const profileLink = $(this).attr('href');
                const img = $(this).find('img').attr('src');
                const name = $(this).find('div').find('h3').text();
                const title = $(this).find('div').contents().filter(function() {
                    return this.nodeType === 3;
                }).text();

                let imgString = img.toString().replace('https://www.lakeareatech.edu/wp-content/uploads/','').slice(8);
                downloadImage(img, imgString);

                console.log(imgString);

                const imgPath = '/images/' + imgString;

                employees.push({
                    id,
                    parent,
                    profileLink,
                    imgPath,
                    name,
                    title
                });

                //console.log(employees);

            });
        });

        var csv = convertToCSV(employees);
        saveToFile(csv, 'download.csv');


        // $('.staff_card', html).each(function() {
        //     const id = employees.length + 1;
        //     const profileLink = $(this).attr('href');
        //     const img = $(this).find('img').attr('src');
        //     const name = $(this).find('div').find('h3').text();
        //     const title = $(this).find('div').contents().filter(function() {
        //         return this.nodeType === 3;
        //     }).text();

        //     employees.push({
        //         id,
        //         profileLink,
        //         img,
        //         name,
        //         title
        //     });
        // });

        // console.log(employees);

        // var csv = convertToCSV(employees);
        // saveToFile(csv, 'download.csv');

    }).catch(err => console.log(err));

app.listen(PORT, () => console.log(`server running on PORT ${PORT}`));