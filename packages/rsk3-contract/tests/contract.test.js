import * as Utils from 'rsk3-utils';
import {formatters} from 'web3-core-helpers';
import {AbiCoder} from 'rsk3-abi';
import {AbstractWeb3Module} from 'web3-core';
import AbiMapper from '../src/mappers/abiMapper';
import AbiModel from '../src/models/abiModel';
import MethodsProxy from '../src/proxies/methodsProxy';
import MethodFactory from '../src/factories/methodFactory';
import ContractModuleFactory from '../src/factories/contractModuleFactory';
import EventLogSubscription from '../src/subscriptions/eventLogSubscription';
import EventSubscriptionsProxy from '../src/proxies/eventSubscriptionsProxy';
import AbstractContract from '../src/abstractContract';

// Mocks
jest.mock('rsk3-abi');
jest.mock('../src/models/abiModel');
jest.mock('../src/mappers/abiMapper');
jest.mock('../src/proxies/methodsProxy');
jest.mock('../src/factories/methodFactory');
jest.mock('../src/factories/contractModuleFactory');
jest.mock('../src/proxies/eventSubscriptionsProxy');
jest.mock('../src/subscriptions/eventLogSubscription');

/**
 * AbstractContract test
 */
describe('AbstractContractTest', () => {
    let abstractContract,
        contractModuleFactoryMock,
        abiCoderMock,
        abiMapperMock,
        methodFactoryMock,
        abiModelMock,
        methodsProxyMock,
        eventSubscriptionsProxyMock,
        abi,
        options;

    beforeEach(() => {
        new ContractModuleFactory();
        contractModuleFactoryMock = ContractModuleFactory.mock.instances[0];

        new AbiCoder();
        abiCoderMock = AbiCoder.mock.instances[0];

        new AbiMapper();
        abiMapperMock = AbiMapper.mock.instances[0];

        new AbiModel();
        abiModelMock = AbiModel.mock.instances[0];

        new MethodsProxy();
        methodsProxyMock = MethodsProxy.mock.instances[0];

        new EventSubscriptionsProxy();
        eventSubscriptionsProxyMock = EventSubscriptionsProxy.mock.instances[0];

        new MethodFactory();
        methodFactoryMock = MethodFactory.mock.instances[0];

        abi = [];
        options = {transactionSigner: {}, data: ''};

        contractModuleFactoryMock.createAbiMapper.mockReturnValueOnce(abiMapperMock);

        contractModuleFactoryMock.createMethodFactory.mockReturnValueOnce(methodFactoryMock);

        contractModuleFactoryMock.createMethodsProxy.mockReturnValueOnce(methodsProxyMock);

        contractModuleFactoryMock.createEventSubscriptionsProxy.mockReturnValueOnce(eventSubscriptionsProxyMock);

        abiMapperMock.map.mockReturnValueOnce(abiModelMock);

        abstractContract = new AbstractContract(
            'http://localhost:8545',
            contractModuleFactoryMock,
            {},
            abiCoderMock,
            Utils,
            formatters,
            abi,
            '0x0',
            options
        );
    });

    it('constructor check', () => {
        expect(contractModuleFactoryMock.createAbiMapper).toHaveBeenCalled();

        expect(contractModuleFactoryMock.createMethodFactory).toHaveBeenCalled();

        expect(contractModuleFactoryMock.createMethodsProxy).toHaveBeenCalledWith(abstractContract);

        expect(contractModuleFactoryMock.createEventSubscriptionsProxy).toHaveBeenCalledWith(abstractContract);

        expect(abiMapperMock.map).toHaveBeenCalledWith([]);

        expect(abstractContract.contractModuleFactory).toEqual(contractModuleFactoryMock);

        expect(abstractContract.abiCoder).toEqual(abiCoderMock);

        expect(abstractContract.utils).toEqual(Utils);

        expect(abstractContract.formatters).toEqual(formatters);

        expect(abstractContract.abiMapper).toEqual(abiMapperMock);

        expect(abstractContract.options).toEqual({address: '0x0', transactionSigner: {}, data: ''});

        expect(abstractContract.accounts).toEqual({});

        expect(abstractContract.methodFactory).toEqual(methodFactoryMock);

        expect(abstractContract.abiModel).toEqual(abiModelMock);

        expect(abstractContract.address).toEqual('0x0');

        expect(abstractContract.data).toEqual('');

        expect(abstractContract.transactionSigner).toEqual({});

        expect(abstractContract.methods).toEqual(methodsProxyMock);

        expect(abstractContract.events).toEqual(eventSubscriptionsProxyMock);

        expect(abstractContract).toBeInstanceOf(AbstractWeb3Module);
    });

    it('calls once and throws an error because no callback is defined', () => {
        expect(() => {
            abstractContract.once('event', {});
        }).toThrow('Once requires a callback function.');
    });

    it('calls once and returns one subscription item', () => {
        new EventLogSubscription();
        const eventSubscriptionMock = EventLogSubscription.mock.instances[0];

        eventSubscriptionMock.on = jest.fn((event, callback) => {
            expect(event).toEqual('data');

            expect(callback).toBeInstanceOf(Function);

            callback();
        });

        eventSubscriptionsProxyMock.event = jest.fn((options, callback) => {
            expect(options).toEqual({});

            expect(callback).toBeInstanceOf(Function);

            return eventSubscriptionMock;
        });

        const options = {fromBlock: true};
        abstractContract.once('event', options, () => {});

        expect(eventSubscriptionMock.unsubscribe).toHaveBeenCalled();

        expect(eventSubscriptionMock.on).toHaveBeenCalled();

        expect(options.fromBlock).toBeUndefined();
    });

    it('calls getPastEvents and returns a resolved promise', async () => {
        abiModelMock.hasEvent.mockReturnValueOnce(true);

        abiModelMock.getEvent.mockReturnValueOnce({});

        const getPastLogsMethodMock = {};
        getPastLogsMethodMock.execute = jest.fn();
        getPastLogsMethodMock.execute.mockReturnValueOnce(Promise.resolve(true));

        methodFactoryMock.createPastEventLogsMethod.mockReturnValueOnce(getPastLogsMethodMock);

        await expect(abstractContract.getPastEvents('eventName', {}, () => {})).resolves.toEqual(true);

        expect(abiModelMock.hasEvent).toHaveBeenCalledWith('eventName');

        expect(abiModelMock.getEvent).toHaveBeenCalledWith('eventName');

        expect(getPastLogsMethodMock.execute).toHaveBeenCalled();

        expect(methodFactoryMock.createPastEventLogsMethod).toHaveBeenCalledWith({}, abstractContract);

        expect(getPastLogsMethodMock.parameters).toEqual([{}]);

        expect(getPastLogsMethodMock.callback).toBeInstanceOf(Function);
    });

    it('calls getPastEvents with "allEvents" and returns a resolved promise', async () => {
        const getPastLogsMethodMock = {};
        getPastLogsMethodMock.execute = jest.fn();
        getPastLogsMethodMock.execute.mockReturnValueOnce(Promise.resolve(true));

        methodFactoryMock.createAllPastEventLogsMethod.mockReturnValueOnce(getPastLogsMethodMock);

        await expect(abstractContract.getPastEvents('allEvents', {}, () => {})).resolves.toEqual(true);

        expect(getPastLogsMethodMock.execute).toHaveBeenCalled();

        expect(methodFactoryMock.createAllPastEventLogsMethod).toHaveBeenCalledWith(abiModelMock, abstractContract);

        expect(getPastLogsMethodMock.parameters).toEqual([{}]);

        expect(getPastLogsMethodMock.callback).toBeInstanceOf(Function);
    });

    it('calls getPastEvents and returns a rejected promise', async () => {
        abiModelMock.hasEvent.mockReturnValueOnce(false);

        await expect(abstractContract.getPastEvents('eventName', {}, () => {})).rejects.toThrow(
            'Event with name "eventName" does not exists.'
        );

        expect(abiModelMock.hasEvent).toHaveBeenCalledWith('eventName');
    });

    it('calls deploy', () => {
        methodsProxyMock.contractConstructor = jest.fn(() => {
            return true;
        });

        expect(abstractContract.deploy({})).toEqual(true);

        expect(methodsProxyMock.contractConstructor).toHaveBeenCalledWith({});
    });

    it('calls clone and returns the cloned contract object', () => {
        contractModuleFactoryMock.createContract.mockReturnValueOnce({});

        expect(abstractContract.clone()).toEqual({abiModel: abstractContract.abiModel});

        expect(contractModuleFactoryMock.createContract).toHaveBeenCalledWith(
            abstractContract.currentProvider,
            abstractContract.accounts,
            [],
            '',
            {
                data: '',
                defaultAccount: undefined,
                defaultBlock: 'latest',
                defaultGas: undefined,
                defaultGasPrice: undefined,
                transactionBlockTimeout: 50,
                transactionConfirmationBlocks: 24,
                transactionPollingTimeout: 750,
                transactionSigner: {}
            }
        );
    });

    it('gets the jsonInterface property', () => {
        expect(abstractContract.jsonInterface).toEqual(abiModelMock);
    });

    it('sets the jsonInterface property', () => {
        abiMapperMock.map.mockReturnValueOnce(abiModelMock);

        abstractContract.jsonInterface = {};

        expect(abiMapperMock.map).toHaveBeenCalledWith({});

        expect(abstractContract.methods.abiModel).toEqual(abiModelMock);

        expect(abstractContract.events.abiModel).toEqual(abiModelMock);
    });
});
