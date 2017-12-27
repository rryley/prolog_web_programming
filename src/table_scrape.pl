% General solution to extracting data from table.
% Problem: Given an xpath to a table in a web document, write
% a program to extract all of the data without knowing the number
% of rows (or columns) in advance.
%
% Solution: the Xpath library allows us to query the Last element of a
% structure:
%
%  ie. //foo/bar/baz/table/tr(last)/td(text).
%
%  An increment state variable is needed that is inserted into where
%  "last" is in the above xpath, at start, the predicate captures the
%  value of the last row, compares the current row to it.  If they are
%  equal, the predicate terminates. If not, the state variable is
%  incremented by 1 and the next row is returned.

:- discontiguous get_local_file/1.
:- use_module(library(csv)).
:- include('scraper.pl').

% Read table into memory starting with last row; the tr(index(last))
% arguments will jump to the last element without needing to know a
% specific value.
%
% This gets pretty close to what I need:
% collect_rows(Xpath, row_cell, Row) :-
%   doc(X), xpath(X, //(div)/table/tbody, TR),
%      findall(Row, xpath(TR, tr(N0)/td(text), Row), Row),
%      Row = [Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr | Rest],
%      assertz(row(Rank,Symbol,Name,BTC_Val,USD_Val,Vol_24_hr)),
%      N1 is N0 + 1,
%      collect_rows(TR, tr(N1)/td(text), Next_row).
%

% Predicate collect_rows/2 accepts 2 arguments - a document previously
% loaded into memory, and an Xpath expression that leads to a table
% within the document.
%

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

%Not complete
/*
%Have user enter correct Xpath before table row
% review compound_name_arguments, compound_name_arity.
% http://www.swi-prolog.org/pldoc/man?section=manipterm
% Some Experiments
% /(div)/table/tbody/tr(last)/td(text) =.. List,
|    [A,B,C] = List,
|    B =.. New_List.
List = [/, /(div)/table/tbody/tr(last), td(text)],
A =  (/),
B = /(div)/table/tbody/tr(last),
C = td(text),
New_List = [/, /(div)/table/tbody, tr(last)].

Going to need a split Xpath procedure as well as reassemble using
compound_name_arity(?Compound, ?Name, ?Arity)
compound_name_arguments(?Compound, ?Name, ?Arguments)

Xpaths are compounds that can be broken up into 3 element lists, with
the longest compound term as the second element.  Recursive splitting
until the last element is tr will permit the appending of arguments like
Last or N via term construction.

*/








