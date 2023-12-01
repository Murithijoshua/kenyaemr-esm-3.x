import useSWR from 'swr';
import { formatDate, parseDate, openmrsFetch } from '@openmrs/esm-framework';
import { MappedBill, PatientInvoice } from './types';
import isEmpty from 'lodash-es/isEmpty';

export const useBills = (patientUuid) => {
  const url = `/ws/rest/v1/cashier/bill?v=full`;
  const { data, error, isLoading, isValidating, mutate } = useSWR<{ data: { results: Array<PatientInvoice> } }>(
    url,
    openmrsFetch,
    {
      errorRetryCount: 2,
    },
  );

  const mapBillProperties = (bill: PatientInvoice): MappedBill => {
    // create base object
    const mappedBill: MappedBill = {
      id: bill?.id,
      uuid: bill?.uuid,
      patientName: bill?.patient?.display.split('-')?.[1],
      identifier: bill?.patient?.display.split('-')?.[0],
      patientUuid: bill?.patient?.uuid,
      status: bill?.status,
      receiptNumber: bill?.receiptNumber,
      cashierName: bill?.cashier?.display,
      cashPointUuid: bill?.cashPoint?.uuid,
      cashPointName: bill?.cashPoint?.name,
      cashPointLocation: bill?.cashPoint?.location?.display,
      dateCreated: bill?.dateCreated ? formatDate(parseDate(bill.dateCreated), { mode: 'wide' }) : '--',
      lineItems: bill.lineItems,
      billingService: bill.lineItems.map((bill) => bill.item).join(' '),
      payments: bill.payments,
    };

    return mappedBill;
  };

  const mappedResults = data?.data ? data?.data?.results?.map((res) => mapBillProperties(res)) : [];
  const filteredResults = mappedResults?.filter((res) => res.patientUuid === patientUuid);
  const formattedBills = isEmpty(patientUuid) ? mappedResults : filteredResults || [];

  return {
    bills: formattedBills,
    error,
    isLoading,
    isValidating,
    mutate,
  };
};
