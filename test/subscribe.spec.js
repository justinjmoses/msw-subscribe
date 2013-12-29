'use strict';

var chai = require('chai');
var expect = chai.expect;

var nock = require('nock');
var mocks = require('../node_modules/msw-api/test/mocks.js');

var subscribe = require('../lib/subscribe.js');
var Subscription = subscribe.Subscription;

describe('subscriber', function () {
    var subscription;
    var config = { apiKey: 'abcdef' };
    var spots = [
        {
            id: 169,
            query: {
                minPeriod: 10,
                minBreakingHeight: 3,
                minSolidStars: 2,
                maxWindSpeed: 15
            }
        },
        {
            id: 358,
            query: {
                minFadedStars: 3
            }
        }
    ];

    describe('create()', function () {
        it('must handle basic scenarios', function () {
            subscription = subscribe.create(config);
            expect(subscription).to.be.instanceof(Subscription);
        });
    });

    describe('main functionality', function () {
        //todo: port this to msw-api 0.0.9
        function mockSpot(spotId, units, response) {
            var mocked = nock('http://magicseaweed.com').get('/api/' + config.apiKey + '/forecast/?spot_id=' + spotId + '&units=' + units);
            mocked.reply(response, (response === 200) ? mocks[spotId] : undefined);
        }

        beforeEach(function () {
            subscription = subscribe.create(config);
            spots.forEach(function (spot) {
                mockSpot(spot.id, 'us', 200);
            });
        });

        function addAllSpots() {
            spots.forEach(function (spot) {
                subscription.addSpot(spot.id, spot.query);
            });
        }

        describe('addSpot()', function () {
            
            it('must support adding a spot', function () {
                addAllSpots();
                expect(subscription.size()).to.equal(2);
            });

            it('must only record one spot for each unique spotId', function () {
                addAllSpots();
                addAllSpots();
                expect(subscription.size()).to.equal(2);
            });
        });

        describe('toArray()', function () {
            beforeEach(function () {
                addAllSpots();
            });

            it('must output all spots as an array', function () {
                expect(subscription.toArray()).to.have.length(2);
            });
        });

        describe('querying & sending', function () {
            beforeEach(function () {
                addAllSpots();
            });

            describe('query()', function () {
                it('must query all if no parameter given', function () {
                    subscription.query().then(function () {
                        var array = subscription.toArray();
                        array.forEach(function (spot) {
                            expect(spot.forecast).to.not.be.undefined;
                        });
                    }, function (err) {
                        throw err;
                    });
                });
            });

            describe('send()', function () {
                it('must send emails as required', function () {
                    subscription.query().then(function () {
                        subscription.send({ email: 'test@example.com' });
                    }, function (err) {
                        throw err;
                    });
                });
            });
        });
    });
});