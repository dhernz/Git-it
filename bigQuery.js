/*jshint multistr: true */
var api = require('./api.js');
var bigquery = require('bigquery-model');
var unparsed_records; // VARIABLE TO STORE RAW INCOMING RECORDS
var parsed_records = []; // ARRAY TO STORE PARSED RECORD INFORMATION
var parsed_legacy = []; // ARRAY TO STORE PARSED LEGACY DATA FROM GOOGLE BG TABLE
var final_records = []; // FINAL RECORDS TO BE STORED
var queryString; // WHERE WE STORE OUR GIANT QUERY STRING

bigquery.auth({ // AUTHORIZATION INFO FOR GOOGLE BIG QUERY
  email: api.EMAIL,
  key: api.PEM
});

var table = new bigquery.Table({ // TABLE THAT HANDLES GET REQUESTS
  projectId: 'test1000-1055',
  datasetId: 'oldstuff',
  table: 'yes',
});

var records_table = new bigquery.Table({ // LEGACY TABLE THAT STORES ALL RECORDS
  projectId: 'test1000-1055',
  datasetId: 'gitit',
  tableId: 'records'
});

// QUERY TO GET NEW RECORDS FROM YESTERDAY
table.query('SELECT repo.name, repo.url \
  FROM [githubarchive:day.yesterday] \
  WHERE payload CONTAINS \'"language":"JavaScript"\' \
  GROUP EACH BY repo.name, repo.url \
  ORDER BY repo.name')
  .then(function(records){ // STORES RECORDS
    unparsed_records = records;
  })
  .then(function(){ // PARSES RECORDS
    unparsed_records[0].rows.forEach(function(row){   
      var current = {};
      current.repo_name = row.f[0].v;
      current.repo_url = row.f[1].v;
      parsed_records.push(current);
    });
  })
  .then(function(){ // CONSTRUCTS GIANT STRING TO CHECK IF NEW RECORDS ALREADY EXIST
    var repo_arr = [];
    parsed_records.forEach(function(name){
      repo_arr.push(name.repo_name);
    });
    queryString = 'SELECT * FROM [gitit.records] WHERE repo_name = "' + repo_arr.join('" OR repo_name = "') + '"';
  }) 
  .then(function(){ // QUERY'S LEGACY TABLE WITH GIANT QUERY STRING
    table.query(queryString)
      .then(function(records){ // PARSES INPUT AND STORES IN PARSED LEGACY
        records[0].rows.forEach(function(row){
          var current = {};
          current.repo_name = row.f[0].v;
          current.repo_url = row.f[1].v;
          parsed_legacy.push(current);
        });
      })
      .then(function(){ // COMPARES STRINGIFIED LEGACY TABLE TO NEW RECORDS
        parsed_legacy = JSON.stringify(parsed_legacy);
        parsed_records.forEach(function(repo){
          var reg = new RegExp(repo.repo_name, "g");
          if( parsed_legacy.match(reg) === null ){
            final_records.push(repo);
          }
        });
      })
      .then(function(){ // CREATES ARRAY OF RECORDS TO BE STORED (THEY ARE NOT DUPLICATES)
        if(records_table.length > 0){
          records_table.push(final_records)
            .then(function(){
              console.log('FINISHED!');
            })
            .catch(function(err){
              console.error(err);
            });
        } else {
          console.log('NO INSERTIONS!');
        }
      });
  });