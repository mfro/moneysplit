import { ADD_PERSON, ADD_TRANSACTION, assert, newGroup, type RatioParticipant, type Transaction } from 'moneysplit-common'
import { readFileSync } from 'node:fs'

export type TricountImport = {
  Response: Array<{
    Registry: {
      id: number
      created: string
      updated: string
      uuid: string
      currency: string
      emoji: string
      title: string
      description: any
      category: string
      status: string
      membership_uuid_active: any
      memberships: Array<{
        RegistryMembershipNonUser: {
          id: number
          created: string
          updated: string
          uuid: string
          alias: {
            display_name: string
            pointer: {
              type: string
              value: string
              name: string
            }
          }
          status: string
          setting: {
            auto_add_card_transaction: string
            time_auto_add_card_transaction_end: any
            time_auto_add_card_transaction_start: any
            card_ids: Array<any>
            card_labels: Array<any>
          }
          auto_add_card_transaction: string
          remover: any
        }
      }>
      last_activity_timestamp: string
      public_identifier_token: string
      all_registry_entry: Array<{
        RegistryEntry: {
          id: number
          created: string
          updated: string
          uuid: string
          status: string
          amount: {
            currency: string
            value: string
          }
          amount_local: {
            currency: string
            value: string
          }
          exchange_rate: string
          description: string
          type: string
          type_transaction: string
          membership_owned: {
            RegistryMembershipNonUser: {
              id: number
              created: string
              updated: string
              uuid: string
              alias: {
                display_name: string
                pointer: {
                  type: string
                  value: string
                  name: string
                }
              }
              status: string
              setting: {
                auto_add_card_transaction: string
                time_auto_add_card_transaction_end: any
                time_auto_add_card_transaction_start: any
                card_ids: Array<any>
                card_labels: Array<any>
              }
              auto_add_card_transaction: string
              remover: any
            }
          }
          allocations: Array<{
            amount: {
              currency: string
              value: string
            }
            amount_local: {
              currency: string
              value: string
            }
            membership: {
              RegistryMembershipNonUser: {
                id: number
                created: string
                updated: string
                uuid: string
                alias: {
                  display_name: string
                  pointer: {
                    type: string
                    value: string
                    name: string
                  }
                }
              }
            }
            type: string
            share_ratio?: number
          }>
          attachment: Array<any>
          category: string
          category_custom?: string
          date: string
        }
      }>
      all_registry_gallery_attachment: Array<any>
      setting: any
    }
  }>
}

function importTricount(fileName: string) {
  const raw = readFileSync(fileName, 'utf8');
  const data = JSON.parse(raw) as TricountImport;

  const group = newGroup();

  for (const member of data.Response[0].Registry.memberships) {
    console.log(`${member.RegistryMembershipNonUser.alias.display_name}`);
    ADD_PERSON.impl(group, {
      name: member.RegistryMembershipNonUser.alias.display_name,
    });
  }

  for (const transaction of data.Response[0].Registry.all_registry_entry) {
    const entry = transaction.RegistryEntry;
    const label = entry.description;
    const date = new Date(entry.date);
    date.setSeconds(date.getSeconds() - 1);

    const cost = Math.round(parseFloat(entry.amount.value) * 100);
    assert(cost % 1 === 0, `invalid amount: ${entry.amount.value} ${cost}`);

    const payerName = entry.membership_owned.RegistryMembershipNonUser.alias.display_name;
    const payer = group.people.find(p => p.name === payerName);
    assert(payer !== undefined, `unknown participant: ${entry}`)

    const participants: RatioParticipant[] = [];
    for (const allocation of entry.allocations) {
      const person = group.people.find(p => p.name === allocation.membership.RegistryMembershipNonUser.alias.display_name);
      assert(person !== undefined, `unknown participant: ${entry}`)

      if (allocation.type === 'RATIO') {
        participants.push({
          person: person.id,
          ratio: allocation.share_ratio!,
        });
      } else if (allocation.type === 'AMOUNT') {

        if (allocation.amount.value === '0.00') {
          // non-participant
        } else {
          const portion = Math.round(parseFloat(allocation.amount.value) * 100);

          if (portion === cost) {
            assert(entry.allocations.every(a => a.amount.value === '0.00' || a === allocation), '?');

            participants.push({
              person: person.id,
              ratio: 1,
            });
          } else if (entry.allocations.every(a =>
            Math.abs(
              Math.round(parseFloat(a.amount.value) * 100)
              - cost / entry.allocations.length) < 1
          )) {
            participants.push({
              person: person.id,
              ratio: 1,
            });
          } else {
            participants.push({
              person: person.id,
              ratio: Math.abs(portion),
            });
          }
        }

      } else {
        console.log(allocation.type);
      }
    }

    if (participants.length !== 2 || participants.some(p => p.ratio !== 1)) {
      console.log(`${label} ${date} ${cost} ${payer.id}`)
      console.log(participants)
    }

    const t: Transaction = {
      id: 0,
      type: 'expense',
      date,
      cost: -cost,
      label,
      payer: payer.id,
      split: {
        type: 'ratio',
        participants,
      },
    };

    ADD_TRANSACTION.impl(group, t);
  }

  return group;
}
