/*
 Simple scraper for 2 websites:
 https://www.coingecko.com
 https://www.bitinfocharts.com/correlations.html

 Process: 1. load documents into memory.
          2. extract tabular data and create row structure
          3. output CSV format

Gecko xpath
/html/body/div/div[3]/div[3]/div/table/thead/tr/th[2]

 Correlation table will have row describing coins with extra field
 describing head of table.

corr_head xpath
/html/body/div[4]/table/tbody/tr[1]/th[2] maps to //div(4)/table/tr(1)/th(text)


*/

:- use_module(library(csv)).
:- include('scraper.pl').

:- dynamic
    gecko/1,
    bitinfo_corr/1,
    bitinfo_fact/1,
    gecko_row/8,
    corr_head/22,
    corr_row/21,
    factor_head/22,
    factor_row/21.

% Some list variables documenting table headings to check if page has
% changed. Parsed headings will be unified with lists described below.
% If unification succeeds, data will be extracted. If unification fails,
% whatever is loaded into memory will be dumped in termified html format
% for human troubleshooting.

% Coin Gecko website has 8 visible headings (9 total) as follows. Empty
% atom is for repetition of symbols on row level.

Gecko_Head = ['',
              'NAME',      'PRICE',     'MKT CAP',         'LIQUIDITY',
              'DEVELOPER', 'COMMUNITY', 'PUBLIC INTEREST', 'TOTAL'].


% Correlation table has 21 visible headings (22 total); 7 items placed
% on each line for readability.

Corr_Head = ['',
             'Bitcoin',      'Ripple',          'Etherium', 'Bitcoin Cash','Litecoin', 'Dash',     'Monero',
             'Bitcoin Gold', 'Etherium Classic','Zcash',    'Dogecoin',    'Reddcoin', 'Vertcoin', 'Peercoin',
             'Feathercoin',  'Namecoin',        'Blackcoin','Auroracoin',  'Novacoin', 'Quarkcoin','Megacoin'].

Factor_Head = Corr_Head.


gecko_head('',
           'NAME',      'PRICE',     'MKT CAP',         'LIQUIDITY',
           'DEVELOPER', 'COMMUNITY', 'PUBLIC INTEREST', 'TOTAL').

gecko_row(Name, Price, Mkt_Cap, Liquidity, Developer, Community, Public_Interest, Total).

corr_head('Symbol',
          'Bitcoin',     'Ripple',          'Etherium', 'Bitcoin Cash','Litecoin', 'Dash',      'Monero',
          'Bitcoin Gold','Etherium Classic','Zcash',    'Dogecoin',    'Reddcoin', 'Vertcoin',  'Peercoin',
          'Feathercoin', 'Namecoin',        'Blackcoin','Auroracoin',  'Novacoin', 'Quarkcoin', 'Megacoin').

corr_row(Bitcoin,      Ripple,           Ethereum,  Bitcoin_Cash, Litecoin, Dash,      Monero,
         Bitcoin_Gold, Ethereum_Classic, Zcash,     Dogecoin,     Reddcoin, Vertcoin,  Peercoin,
         Feathercoin,  Namecoin,         Blackcoin, Auroracoin,   Novacoin, Quarkcoin, Megacoin).


collect_rows(DOM, Xpath) :- collect_rows_aux(DOM,Xpath, 1).

% Base case initial call to procedure: Row_Number is unified/assigned
% to 1 on first call. The output of the call to findall/3 is a list
% containing the cells tagged as /td in the document. Row is unified
% with an anonymous list that corresponds to the headings in the table.
% Those headings can then be asserted in a structure, giving O(1)
% access.
%
% Induction: As long as the length of Row is > 0, the Row_Number
% is incremented by 1, unified/assigned to Next, and
% the procedure is called again with Next as the 3rd argument, which
% leads to the next row of the table.
%
% A cut needs to be placed before the recursive call to eliminate an
% unnecessary choice point that will freeze the toplevel.

collect_rows_aux(DOM, Xpath, Row_Number) :-
   xpath(DOM, Xpath, TR),
      findall(Row, xpath(TR, tr(Row_Number)/td(text), Row), Row),
      length(Row, Row_Length),
      Row_Length > 0,
      Row = [Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr | _Rest],
      assertz(row(Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr)),
      Next is Row_Number + 1,
      !,
      collect_rows_aux(DOM, Xpath, Next).

% Termination: A query to a nonexistent row in the document results in
% an empty list.  Empty lists have a length of 0, so the total number of
% records asserted is Row_Number - 1. There are no further records to
% process, so feedback is provided to the user.

collect_rows_aux(DOM,Xpath, Row_Number) :-
   xpath(DOM, Xpath, TR),
      findall(Row, xpath(TR, tr(Row_Number)/td(text), Row), Row),
      length(Row,Row_Length),
      Row_Length == 0,
      Records is Row_Number - 1,
      nl,
      write("  There were "),
      write(Records), write(" records entered into database."),
      nl,
      write("Query row(Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr) to retrive.  "),
      nl.

collect_rows(help) :-
    write(
        "Enter the document, and the Xpath expression for the table, just before the
    row you want. Example:
        \"collect_rows(Doc, //(div)/table/) or
          collect_rows(Doc, //div/table/tbody) \"
    starts at the first row and extracts all rows after it. You must know the precise
    Xpath expression for the part just before the table row.  The Xpath should not
    contain any reference to tr or td.").

save_data(File) :-
   setup_call_cleanup(
       open(File, write, Out),
       forall(row(C1,C2,C3,C4,C5,C6),
              csv_write_stream(Out, [row(C1,C2,C3,C4,C5,C6)], [])),
       close(Out)).









