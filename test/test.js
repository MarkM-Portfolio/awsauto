const assert = require('assert')
const request = require('supertest')
const path = require('path')
const fs = require('fs')

const app = require('../app')


describe('indexRouter', function() {
  const file_path = path.join(__dirname, '..', 'icautomation-token')
  console.log(file_path)
  const token = fs.readFileSync(file_path).toString().trim();

  it('reponds 401 to /', function testRoot(done) {
    request(app)
      .get('/')
      .expect(401, done)
  })

  it('requires auth on /instances', function testRoot(done) {
    request(app)
      .get('/instances')
      .expect(401, done)
  })

  it('requires auth on PUT /instances/lcuato100', function testRoot(done) {
    request(app)
      .put('/instances/lcauto100')
      .expect(401, done)
  })

  it('returns data for auth users on /instances', function testRoot(done) {
    // test environemt does not have AWS system will get 500
    request(app)
      .get('/instances')
      .auth('admin', token)
      .expect(500, done)
  })

  it('allows get /instances/lcauto*', function testRoot(done) {
    // test environemt does not have AWS system returns 404
    request(app)
      .get('/instances/lcauto100')
      .auth('admin', token)
      .expect(404, done)
  })

  it('allows get /instances/bvt*', function testRoot(done) {
    // test environemt does not have AWS system return 404
    request(app)
      .get('/instances/bvtsql')
      .auth('admin', token)
      .expect(404, done)
  })
  
  it('disallows get non lcauto /instances', function testRoot(done) {
    request(app)
      .get('/instances/production-server')
      .auth('admin', token)
      .expect(400, done)
  })

  it('response to PUT /instances/lcauto100', function testRoot(done) {
    // test environemt does not have AWS system return 404
    request(app)
      .put('/instances/lcauto100')
      .auth('admin', token)
      .send({action: 'on'})
      .expect(404, done)
  })
})
